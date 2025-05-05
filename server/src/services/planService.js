// src/services/planService.js
import {
  sequelize,
  TrainingPlan,
  WorkoutSession,
  WorkoutExercise,
  Exercise, // Needed for includes
  User, // Needed for includes
  ExerciseResult, // Make sure ExerciseResult is imported
} from "../models/index.js";
import { Op } from "sequelize";

// --- Custom Error Classes (Optional but Recommended) ---
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

const planService = {
  /**
   * Checks if a plan belongs to the specified user.
   * Throws ForbiddenError if not owned.
   * Throws NotFoundError if plan doesn't exist.
   * @param {string} planId
   * @param {string} userId
   * @param {object} [options={}] Sequelize query options (e.g., transaction)
   * @returns {Promise<TrainingPlan>} The found and verified plan instance.
   */
  _checkPlanOwnership: async (planId, userId, options = {}) => {
    const plan = await TrainingPlan.findByPk(planId, options);
    if (!plan) {
      throw new NotFoundError(`Training plan with ID ${planId} not found.`);
    }
    if (plan.user_id !== userId) {
      throw new ForbiddenError();
    }
    return plan;
  },

  /**
   * Checks if all sessions in a plan are completed or skipped and updates plan status.
   * @param {string} planId The ID of the plan to check.
   * @param {object} [transaction] Optional Sequelize transaction object.
   * @returns {Promise<void>}
   */
  _checkAndUpdatePlanStatus: async (planId, transaction) => {
    try {
      const plan = await TrainingPlan.findByPk(planId, {
        include: [
          {
            model: WorkoutSession,
            as: "sessions",
            attributes: ["id", "status"], // Only need ID and status
          },
        ],
        transaction, // Pass transaction
      });

      if (!plan) {
        console.warn(`_checkAndUpdatePlanStatus: Plan ${planId} not found.`);
        return; // Plan might have been deleted
      }

      // If plan is already completed, archived, or paused, no need to check sessions
      if (plan.status !== "Active") {
        return;
      }

      const totalSessions = plan.sessions.length;
      if (totalSessions === 0) {
        // Decide how to handle plans with no sessions. Maybe auto-complete?
        // For now, let's not auto-complete if empty.
        return;
      }

      const completedOrSkippedCount = plan.sessions.filter(
        (session) =>
          session.status === "Completed" || session.status === "Skipped"
      ).length;

      console.log(
        `Plan ${planId}: Total sessions: ${totalSessions}, Completed/Skipped: ${completedOrSkippedCount}`
      );

      if (completedOrSkippedCount === totalSessions) {
        // All sessions are done or skipped, mark plan as Completed
        plan.status = "Completed";
        await plan.save({ transaction }); // Pass transaction
        console.log(`Plan ${planId} status updated to Completed.`);

        // TODO: Here you might trigger the weekly update task for this user
        // Example: weeklyUpdateService.triggerUpdateForUser(plan.user_id);
        // This would need careful design to avoid triggering multiple times.
      }
      // Else: Plan is still in progress, do nothing to its status
    } catch (error) {
      console.error(
        `Error in _checkAndUpdatePlanStatus for plan ${planId}:`,
        error
      );
      // Do NOT re-throw here. Log the error and let the main process continue.
      // The transaction will be handled by the caller (e.g., _checkAndUpdateSessionStatus).
    }
  },

  /**
   * Updates the status of a specific training plan.
   * @param {string} planId The ID of the plan to update.
   * @param {string} userId The ID of the user requesting the update.
   * @param {'Active' | 'Completed' | 'Paused' | 'Archived'} newStatus The new status.
   * @returns {Promise<TrainingPlan>} The updated training plan.
   */
  updatePlanStatus: async (planId, userId, newStatus) => {
    const transaction = await sequelize.transaction();
    try {
      const plan = await planService._checkPlanOwnership(planId, userId, {
        transaction,
      });

      // Optional: Add logic here if status transitions are restricted
      // (e.g., cannot move from Completed back to Active directly)

      plan.status = newStatus;
      await plan.save({ transaction });

      await transaction.commit();
      return plan;
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating plan status:", error);
      throw error; // Re-throw the original error (could be NotFoundError, ForbiddenError, or others)
    }
  },

  /**
   * Gets a specific training plan by ID, including its sessions and exercises.
   * Ensures the plan belongs to the requesting user.
   * @param {string} planId The ID of the plan.
   * @param {string} userId The ID of the requesting user.
   * @returns {Promise<TrainingPlan>} The training plan with nested data.
   */
  getPlanById: async (planId, userId) => {
    try {
      // Check ownership first (without transaction needed for read)
      await planService._checkPlanOwnership(planId, userId);

      // Fetch the plan again with all includes
      const plan = await TrainingPlan.findByPk(planId, {
        include: [
          {
            model: WorkoutSession,
            as: "sessions",
            separate: true, // Often better performance for multiple hasMany includes
            order: [["date", "ASC"]], // Order sessions by date
            include: [
              {
                model: WorkoutExercise,
                as: "workoutExercises",
                separate: true, // Separate query for workout exercises *per session*
                order: [["order", "ASC"]], // Order exercises within session
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
          },
          // Optional: Include user details if needed, excluding password
          // { model: User, as: 'user', attributes: { exclude: ['password'] } }
        ],
      });

      // We already checked ownership, but a final check in case of race conditions (unlikely)
      if (!plan || plan.user_id !== userId) {
        throw new NotFoundError(
          `Training plan with ID ${planId} not found or access denied.`
        );
      }

      return plan;
    } catch (error) {
      console.error("Error getting plan by ID:", error);
      throw error; // Re-throw
    }
  },

  /**
   * Gets all training plans for a specific user.
   * @param {string} userId The ID of the user.
   * @returns {Promise<TrainingPlan[]>} An array of training plans.
   */
  getUserPlans: async (userId) => {
    try {
      const plans = await TrainingPlan.findAll({
        where: { user_id: userId },
        order: [["createdAt", "DESC"]], // Example: order by creation date
        // Add includes if you want basic session info here, but avoid deep nesting for lists
        // include: [{ model: WorkoutSession, as: 'sessions', attributes: ['id', 'name', 'date', 'status'] }]
      });
      return plans;
    } catch (error) {
      console.error("Error getting user plans:", error);
      throw new Error("Failed to retrieve user training plans."); // Generic error for controller
    }
  },
};

// Export the service and potentially the custom errors
export { planService, NotFoundError, ForbiddenError };
