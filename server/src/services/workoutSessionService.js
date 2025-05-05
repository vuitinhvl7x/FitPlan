// src/services/workoutSessionService.js
import {
  sequelize,
  WorkoutSession,
  WorkoutExercise,
  TrainingPlan, // Needed for ownership check
  Exercise, // Needed for includes and validation
  ExerciseResult, // Make sure ExerciseResult is imported
} from "../models/index.js";
import { Op } from "sequelize";
import { planService } from "./planService.js"; // Import the service for cascading
import { isPast, isToday } from "date-fns"; // Import isToday

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
   * Checks if all exercises in a session are completed or skipped and updates session status.
   * Also marks exercises/sessions as Skipped if their date is in the past and they are not completed.
   * This function is called internally by other services (like logResult) or by the scheduled task.
   * @param {string} sessionId The ID of the session to check.
   * @param {object} [transaction] Optional Sequelize transaction object.
   * @returns {Promise<void>}
   */
  _checkAndUpdateSessionStatus: async (sessionId, transaction) => {
    // Note: This function is primarily for *automatic* status updates based on exercise completion
    // or date passing (via scheduled task). Manual status updates use updateSessionStatus.
    try {
      const session = await WorkoutSession.findByPk(sessionId, {
        include: [
          {
            model: WorkoutExercise,
            as: "workoutExercises",
            attributes: ["id", "status"],
          },
        ],
        transaction, // Pass transaction
      });

      if (!session) {
        console.warn(
          `_checkAndUpdateSessionStatus: Session ${sessionId} not found.`
        );
        return; // Session might have been deleted
      }

      // If session is already completed or skipped, no need to check exercises
      if (session.status === "Completed" || session.status === "Skipped") {
        return;
      }

      const totalExercises = session.workoutExercises.length;
      const sessionDate = session.date; // Assuming session.date is a Date object or can be treated as one

      // --- Logic to mark overdue exercises as Skipped (used by scheduled task or late log) ---
      // This part is still relevant for sessions *with* exercises that are overdue
      let exercisesNeedUpdate = false;
      if (isPast(sessionDate, { unit: "day" })) {
        console.log(
          `Session ${sessionId} date ${sessionDate} is in the past. Checking for overdue exercises.`
        );
        for (const we of session.workoutExercises) {
          if (we.status === "Planned" || we.status === "Started") {
            we.status = "Skipped";
            await we.save({ transaction }); // Save individually within the loop
            exercisesNeedUpdate = true; // Indicate that at least one exercise was updated
            console.log(
              `WorkoutExercise ${we.id} marked as Skipped due to overdue session.`
            );
          }
        }
        // Reload session exercises if any were updated to get the latest statuses for the filter below
        if (exercisesNeedUpdate) {
          await session.reload({
            include: [
              {
                model: WorkoutExercise,
                as: "workoutExercises",
                attributes: ["id", "status"],
              },
            ],
            transaction,
          });
          console.log(
            `Session ${sessionId} exercises reloaded after marking some as Skipped.`
          );
        }
      }
      // --- END overdue exercises logic ---

      // --- Logic to check if session is completed based on exercise statuses ---
      // This logic only applies to sessions *with* exercises
      if (totalExercises > 0) {
        const completedOrSkippedCount = session.workoutExercises.filter(
          (ex) => ex.status === "Completed" || ex.status === "Skipped"
        ).length;

        console.log(
          `Session ${sessionId}: Total exercises: ${totalExercises}, Completed/Skipped: ${completedOrSkippedCount}`
        );

        if (completedOrSkippedCount === totalExercises) {
          // All exercises are done or skipped, mark session as Completed
          session.status = "Completed";
          await session.save({ transaction }); // Pass transaction
          console.log(`Session ${sessionId} status updated to Completed.`);

          // Trigger cascading status update check for the parent plan
          const planId = session.training_plan_id;
          // Call the helper function in planService
          await planService._checkAndUpdatePlanStatus(planId, transaction); // Pass transaction
          console.log(`Triggered plan status check for plan ${planId}.`);
        }
        // Else: Session is still in progress or planned, do nothing to its status
      }
      // Note: Sessions with totalExercises === 0 (Rest Days) are NOT automatically marked Completed here.
      // They rely on the scheduled task marking them Skipped if overdue, OR manual completion via updateSessionStatus.
    } catch (error) {
      console.error(
        `Error in _checkAndUpdateSessionStatus for session ${sessionId}:`,
        error
      );
      // Do NOT re-throw here, as this is a background check function.
      // Log the error and let the main process continue.
      // The transaction will be handled by the caller (e.g., logResult).
    }
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
              // Include ExerciseResults for each WorkoutExercise
              {
                model: ExerciseResult,
                as: "results",
                order: [["set_number", "ASC"]], // Order results by set number
                required: false, // <--- ADD THIS LINE
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
          status: "Planned", // Default status for new exercise
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

  // --- NEW: Service method to update session status manually ---
  /**
   * Updates the status of a specific workout session manually.
   * @param {string} sessionId ID of the session to update.
   * @param {string} userId ID of the user requesting the update.
   * @param {'Completed' | 'Skipped'} newStatus The new status (only these allowed manually).
   * @returns {Promise<WorkoutSession>} The updated WorkoutSession instance.
   */
  updateSessionStatus: async (sessionId, userId, newStatus) => {
    const transaction = await sequelize.transaction();
    try {
      // 1. Check session ownership
      const session = await workoutSessionService._checkSessionOwnership(
        sessionId,
        userId,
        { transaction }
      );

      // 2. Validate the new status (redundant if validator is used, but safe)
      const allowedManualStatuses = ["Completed", "Skipped"];
      if (!allowedManualStatuses.includes(newStatus)) {
        // This should be caught by validator, but good to have a service-level check
        await transaction.rollback();
        throw new Error(`Invalid status value for manual update: ${newStatus}`);
      }

      // 3. Prevent updating if already in a final state (optional, depends on desired flow)
      if (session.status === "Completed" || session.status === "Skipped") {
        await transaction.rollback();
        // Or return the existing session? Throwing might be clearer.
        throw new Error(
          `Session ${sessionId} is already ${session.status}. Cannot update status.`
        );
      }

      // 4. Update the session status
      session.status = newStatus;
      await session.save({ transaction });
      console.log(
        `Session ${sessionId} status manually updated to ${newStatus}.`
      );

      // 5. Trigger cascading status update check for the parent plan
      // This is crucial for the plan to become Completed if this was the last session
      const planId = session.training_plan_id;
      await planService._checkAndUpdatePlanStatus(planId, transaction); // Pass transaction
      console.log(
        `Triggered plan status check for plan ${planId} after manual session update.`
      );

      await transaction.commit(); // Commit the transaction
      // Return the updated instance (might need to reload if includes are desired)
      return session; // Or session.reload({ include: [...] }) if needed
    } catch (error) {
      await transaction.rollback(); // Rollback on error
      console.error(`Error updating session ${sessionId} status:`, error);
      // Re-throw the original error (could be NotFoundError, ForbiddenError, or others)
      throw error;
    }
  },
  // --- END NEW ---

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

  // TODO: Add other service methods like updateSessionNotes
};

export { workoutSessionService, NotFoundError, ForbiddenError };
