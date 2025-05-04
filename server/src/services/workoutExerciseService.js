// src/services/workoutExerciseService.js
import {
  sequelize,
  WorkoutExercise,
  WorkoutSession, // Needed for ownership check
  TrainingPlan, // Needed for ownership check
  Exercise, // Needed for swap validation
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

const workoutExerciseService = {
  /**
   * Checks if a WorkoutExercise belongs to the specified user via its Session and Plan.
   * Throws ForbiddenError if not owned.
   * Throws NotFoundError if the WorkoutExercise, its Session, or its Plan doesn't exist.
   * @param {string} workoutExerciseId
   * @param {string} userId
   * @param {object} [options={}] Sequelize query options (e.g., transaction, include)
   * @returns {Promise<WorkoutExercise>} The found and verified WorkoutExercise instance.
   */
  _checkWorkoutExerciseOwnership: async (
    workoutExerciseId,
    userId,
    options = {}
  ) => {
    const workoutExercise = await WorkoutExercise.findByPk(workoutExerciseId, {
      include: [
        {
          model: WorkoutSession,
          as: "workoutSession",
          required: true, // Ensure session exists
          include: [
            {
              model: TrainingPlan,
              as: "trainingPlan",
              required: true, // Ensure plan exists
            },
          ],
        },
      ],
      ...options, // Spread other options like transaction
    });

    if (!workoutExercise) {
      throw new NotFoundError(
        `Workout exercise with ID ${workoutExerciseId} not found.`
      );
    }
    if (workoutExercise.workoutSession.trainingPlan.user_id !== userId) {
      throw new ForbiddenError();
    }
    return workoutExercise;
  },

  /**
   * Updates the details (sets, reps, weight, etc.) of a specific WorkoutExercise.
   * @param {string} workoutExerciseId ID of the WorkoutExercise to update.
   * @param {string} userId ID of the user requesting the update.
   * @param {object} updateData Object containing fields to update.
   * @returns {Promise<WorkoutExercise>} The updated WorkoutExercise instance.
   */
  updateWorkoutExercise: async (workoutExerciseId, userId, updateData) => {
    const transaction = await sequelize.transaction();
    try {
      const workoutExercise =
        await workoutExerciseService._checkWorkoutExerciseOwnership(
          workoutExerciseId,
          userId,
          { transaction }
        );

      // Define allowed fields to prevent unwanted updates
      const allowedUpdates = [
        "order",
        "sets_planned",
        "reps_planned",
        "weight_planned",
        "duration_planned",
        "rest_period",
        "notes",
      ];
      const validUpdateData = {};
      for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
          validUpdateData[key] = updateData[key];
        }
      }

      if (Object.keys(validUpdateData).length === 0) {
        // No valid fields provided, maybe return early or throw specific error
        // For now, we proceed, Sequelize update won't do anything if data is empty
      }

      // Perform the update
      await workoutExercise.update(validUpdateData, { transaction });

      await transaction.commit();
      // Return the updated instance (might need to reload if defaults changed, but update returns the instance)
      return workoutExercise;
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating workout exercise:", error);
      if (error.name === "SequelizeValidationError") {
        throw error; // Re-throw validation error
      }
      throw error; // Re-throw other errors
    }
  },

  /**
   * Swaps the base Exercise associated with a WorkoutExercise instance.
   * @param {string} workoutExerciseId ID of the WorkoutExercise to modify.
   * @param {string} userId ID of the user requesting the swap.
   * @param {string} newExerciseId ID of the new base Exercise.
   * @returns {Promise<WorkoutExercise>} The updated WorkoutExercise instance.
   */
  swapExercise: async (workoutExerciseId, userId, newExerciseId) => {
    const transaction = await sequelize.transaction();
    try {
      // 1. Check ownership of the WorkoutExercise
      const workoutExercise =
        await workoutExerciseService._checkWorkoutExerciseOwnership(
          workoutExerciseId,
          userId,
          { transaction }
        );

      // 2. Validate that the new base Exercise exists
      const newBaseExercise = await Exercise.findByPk(newExerciseId, {
        transaction,
      });
      if (!newBaseExercise) {
        throw new NotFoundError(
          `New exercise with ID ${newExerciseId} not found.`
        );
      }

      // 3. Update the exercise_id
      workoutExercise.exercise_id = newExerciseId;
      await workoutExercise.save({ transaction });

      await transaction.commit();
      // Reload to include the new associated Exercise details if needed by frontend
      return workoutExercise.reload({
        include: [{ model: Exercise, as: "exercise" }],
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error swapping exercise:", error);
      throw error; // Re-throw
    }
  },

  /**
   * Deletes a specific WorkoutExercise instance.
   * @param {string} workoutExerciseId ID of the WorkoutExercise to delete.
   * @param {string} userId ID of the user requesting the deletion.
   * @returns {Promise<void>}
   */
  deleteWorkoutExercise: async (workoutExerciseId, userId) => {
    const transaction = await sequelize.transaction();
    try {
      // 1. Check ownership
      const workoutExercise =
        await workoutExerciseService._checkWorkoutExerciseOwnership(
          workoutExerciseId,
          userId,
          { transaction }
        );

      // Optional: Store order before deleting if you need to re-order others
      // const deletedOrder = workoutExercise.order;
      // const sessionId = workoutExercise.workout_session_id;

      // 2. Delete the instance
      await workoutExercise.destroy({ transaction });

      // Optional: Re-order subsequent exercises in the same session
      // await workoutExerciseService._shiftOrders(sessionId, deletedOrder + 1, -1, transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting workout exercise:", error);
      throw error; // Re-throw
    }
  },

  // --- Helper for shifting orders (Example) ---
  /*
     _shiftOrders: async (sessionId, startingOrder, shiftAmount, transaction) => {
         // Implement logic similar to the one in workoutSessionService if needed
     }
     */
  // --- End Helper ---
};

export { workoutExerciseService, NotFoundError, ForbiddenError };
