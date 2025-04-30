// src/services/workoutSessionService.js
import {
  sequelize,
  WorkoutSession,
  WorkoutExercise,
  TrainingPlan, // Needed for ownership check
  Exercise, // Needed for includes and validation
} from "../models/index.js";
import { Op } from "sequelize";

// --- Re-use or re-define Custom Error Classes ---
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.status = 404;
  }
}

class ForbiddenError extends Error {
  constructor(message = "You do not have permission to access this resource.") {
    super(message);
    this.name = "ForbiddenError";
    this.status = 403;
  }
}
// --- End Custom Error Classes ---

const workoutSessionService = {
  /**
   * Checks if a session belongs to the specified user via its TrainingPlan.
   * Throws ForbiddenError if not owned.
   * Throws NotFoundError if session or its plan doesn't exist.
   * @param {string} sessionId
   * @param {string} userId
   * @param {object} [options={}] Sequelize query options (e.g., transaction, include)
   * @returns {Promise<WorkoutSession>} The found and verified session instance.
   */
  _checkSessionOwnership: async (sessionId, userId, options = {}) => {
    const session = await WorkoutSession.findByPk(sessionId, {
      include: [{ model: TrainingPlan, as: "trainingPlan", required: true }], // Ensure plan exists
      ...options, // Spread other options like transaction
    });

    if (!session) {
      throw new NotFoundError(
        `Workout session with ID ${sessionId} not found.`
      );
    }
    if (session.trainingPlan.user_id !== userId) {
      throw new ForbiddenError();
    }
    return session;
  },

  /**
   * Gets a specific workout session by ID, including its exercises.
   * Ensures the session belongs to the requesting user.
   * @param {string} sessionId The ID of the session.
   * @param {string} userId The ID of the requesting user.
   * @returns {Promise<WorkoutSession>} The workout session with nested data.
   */
  getSessionById: async (sessionId, userId) => {
    try {
      // Check ownership first
      await workoutSessionService._checkSessionOwnership(sessionId, userId);

      // Fetch again with includes
      const session = await WorkoutSession.findByPk(sessionId, {
        include: [
          {
            model: TrainingPlan, // Include plan details if needed
            as: "trainingPlan",
            attributes: ["id", "name", "user_id"], // Select specific attributes
          },
          {
            model: WorkoutExercise,
            as: "workoutExercises",
            separate: true,
            order: [["order", "ASC"]],
            include: [
              {
                model: Exercise,
                as: "exercise", // Include details of the base exercise
              },
            ],
          },
        ],
      });

      if (!session) {
        // Should not happen after ownership check, but good practice
        throw new NotFoundError(
          `Workout session with ID ${sessionId} not found.`
        );
      }

      return session;
    } catch (error) {
      console.error("Error getting session by ID:", error);
      throw error; // Re-throw (could be NotFoundError, ForbiddenError, or others)
    }
  },

  /**
   * Adds a new exercise instance to a workout session.
   * @param {string} sessionId The ID of the session.
   * @param {string} userId The ID of the user adding the exercise.
   * @param {object} exerciseData Data for the new WorkoutExercise (exerciseId, sets_planned, etc.).
   * @returns {Promise<WorkoutExercise>} The newly created WorkoutExercise instance.
   */
  addExerciseToSession: async (sessionId, userId, exerciseData) => {
    const transaction = await sequelize.transaction();
    try {
      // 1. Check session ownership
      const session = await workoutSessionService._checkSessionOwnership(
        sessionId,
        userId,
        { transaction }
      );

      // 2. Validate that the base Exercise exists
      const baseExercise = await Exercise.findByPk(exerciseData.exerciseId, {
        transaction,
      });
      if (!baseExercise) {
        throw new NotFoundError(
          `Exercise with ID ${exerciseData.exerciseId} not found.`
        );
      }

      // 3. Determine the order for the new exercise
      let order = exerciseData.order;
      if (order === undefined || order === null) {
        // If order not provided, find the max current order and add 1
        const maxOrderResult = await WorkoutExercise.findOne({
          where: { workout_session_id: sessionId },
          attributes: [
            [sequelize.fn("MAX", sequelize.col("order")), "maxOrder"],
          ],
          raw: true,
          transaction,
        });
        order =
          maxOrderResult && maxOrderResult.maxOrder !== null
            ? maxOrderResult.maxOrder + 1
            : 0;
      } else {
        // Optional: If order IS provided, you might want to shift existing items
        // This adds complexity and is omitted here for simplicity.
        // await workoutSessionService._shiftOrders(sessionId, order, 1, transaction); // Example
      }

      // 4. Create the WorkoutExercise record
      const newWorkoutExercise = await WorkoutExercise.create(
        {
          workout_session_id: sessionId,
          exercise_id: exerciseData.exerciseId,
          order: order,
          sets_planned: exerciseData.sets_planned,
          reps_planned: exerciseData.reps_planned,
          weight_planned: exerciseData.weight_planned,
          duration_planned: exerciseData.duration_planned,
          rest_period: exerciseData.rest_period,
          notes: exerciseData.notes,
        },
        { transaction }
      );

      await transaction.commit();
      return newWorkoutExercise;
    } catch (error) {
      await transaction.rollback();
      console.error("Error adding exercise to session:", error);
      // Check if it's a validation error from Sequelize create
      if (error.name === "SequelizeValidationError") {
        throw error; // Re-throw validation error for controller to handle
      }
      // Re-throw other errors (NotFound, Forbidden, etc.)
      throw error;
    }
  },

  // --- Helper for shifting orders (Example - More complex logic needed for robust implementation) ---
  /*
     _shiftOrders: async (sessionId, startingOrder, shiftAmount, transaction) => {
         await WorkoutExercise.update(
             { order: sequelize.literal(`"order" + ${shiftAmount}`) },
             {
                 where: {
                     workout_session_id: sessionId,
                     order: { [Op.gte]: startingOrder }
                 },
                 transaction
             }
         );
     }
     */
  // --- End Helper ---

  // TODO: Add other service methods like updateSessionNotes, updateSessionStatus
};

export { workoutSessionService, NotFoundError, ForbiddenError };
