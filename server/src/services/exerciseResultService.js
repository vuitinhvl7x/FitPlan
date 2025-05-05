// src/services/exerciseResultService.js
import {
  sequelize,
  ExerciseResult,
  WorkoutExercise,
  WorkoutSession, // Needed for cascading status update
  TrainingPlan, // Needed for cascading status update
  Exercise, // Needed for includes in GET methods
} from "../models/index.js";
import { Op } from "sequelize";
import { workoutSessionService } from "./workoutSessionService.js"; // Import the service for cascading

// --- Re-use Custom Error Classes (Ensure these are defined or imported) ---
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

const exerciseResultService = {
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
   * Logs a new exercise result (e.g., for one set).
   * @param {string} workoutExerciseId The ID of the WorkoutExercise instance.
   * @param {string} userId The ID of the user logging the result.
   * @param {object} resultData Data for the ExerciseResult (set_number, reps_completed, etc.).
   * @returns {Promise<ExerciseResult>} The newly created ExerciseResult instance.
   */
  logResult: async (workoutExerciseId, userId, resultData) => {
    const transaction = await sequelize.transaction();
    try {
      // 1. Check ownership of the WorkoutExercise
      const workoutExercise =
        await exerciseResultService._checkWorkoutExerciseOwnership(
          workoutExerciseId,
          userId,
          { transaction } // Pass transaction
        );

      // 2. Validate input data (basic validation, more detailed in validator)
      if (
        !resultData ||
        typeof resultData.set_number !== "number" ||
        resultData.set_number < 1
      ) {
        throw new Error(
          "Invalid result data: set_number is required and must be a positive integer."
        );
      }
      // Add more validation checks here if needed before creating the record

      // 3. Create the ExerciseResult record
      const newResult = await ExerciseResult.create(
        {
          workout_exercise_id: workoutExerciseId,
          user_id: userId, // Store user_id directly for easier querying
          set_number: resultData.set_number,
          reps_completed: resultData.reps_completed,
          weight_used: resultData.weight_used,
          duration_completed: resultData.duration_completed,
          rating: resultData.rating,
          notes: resultData.notes,
          // completed_at defaults to NOW
        },
        { transaction } // Pass transaction
      );

      // 4. Update WorkoutExercise status based on results
      // Fetch the *current* number of results for this workout exercise within the transaction
      const loggedResultsCount = await ExerciseResult.count({
        where: { workout_exercise_id: workoutExerciseId },
        transaction, // IMPORTANT: Count within the same transaction
      });

      const plannedSets = workoutExercise.sets_planned;
      let statusUpdatedToCompleted = false; // Flag to check if status became Completed

      if (workoutExercise.status === "Planned") {
        // If it was planned, logging the first result starts it
        workoutExercise.status = "Started";
        await workoutExercise.save({ transaction });
        console.log(
          `WorkoutExercise ${workoutExerciseId} status updated to Started.`
        );
      }

      // Check if all planned sets are logged (only if sets_planned is defined and > 0)
      // Also check if status is not already Completed or Skipped
      if (
        plannedSets !== null &&
        plannedSets > 0 &&
        loggedResultsCount >= plannedSets &&
        workoutExercise.status !== "Completed" &&
        workoutExercise.status !== "Skipped" // Ensure we don't re-complete/re-skip
      ) {
        workoutExercise.status = "Completed";
        await workoutExercise.save({ transaction });
        statusUpdatedToCompleted = true; // Set flag
        console.log(
          `WorkoutExercise ${workoutExerciseId} status updated to Completed (all sets logged).`
        );
      }
      // Note: If sets_planned is null or 0, the status won't automatically become 'Completed' this way.
      // A separate mechanism (e.g., user manually marking as complete/skipped) would be needed for those.

      // 5. Trigger cascading status update check for the parent session
      // ONLY if the workout exercise status was just updated to Completed
      if (statusUpdatedToCompleted) {
        // <-- Check the flag
        const sessionId = workoutExercise.workout_session_id;
        await workoutSessionService._checkAndUpdateSessionStatus(
          sessionId,
          transaction
        );
        console.log(
          `Triggered session status check for session ${sessionId} because WorkoutExercise ${workoutExerciseId} completed.`
        );
      } else {
        console.log(
          `WorkoutExercise ${workoutExerciseId} did not complete. Skipping session status check.`
        );
      }

      await transaction.commit(); // Commit the transaction
      console.log(
        `Exercise result logged successfully for WorkoutExercise ${workoutExerciseId}.`
      );
      return newResult;
    } catch (error) {
      await transaction.rollback(); // Rollback on error
      console.error("Error logging exercise result:", error);
      // Re-throw the error for the controller to handle
      throw error;
    }
  },

  /**
   * Gets all exercise results for a specific WorkoutExercise instance.
   * @param {string} workoutExerciseId The ID of the WorkoutExercise instance.
   * @param {string} userId The ID of the user requesting the results.
   * @returns {Promise<ExerciseResult[]>} An array of ExerciseResult instances.
   */
  getResultsForWorkoutExercise: async (workoutExerciseId, userId) => {
    try {
      // Check ownership first - ensures the workout exercise belongs to the user
      // We don't need the full WE object back, just the permission check
      await exerciseResultService._checkWorkoutExerciseOwnership(
        workoutExerciseId,
        userId
      );

      // Fetch the results
      const results = await ExerciseResult.findAll({
        where: { workout_exercise_id: workoutExerciseId },
        order: [
          ["set_number", "ASC"],
          ["completed_at", "ASC"],
        ], // Order by set number, then time
        // Optional: Include the WorkoutExercise and Exercise details if needed
        // include: [{
        //     model: WorkoutExercise,
        //     as: 'workoutExercise',
        //     include: [{ model: Exercise, as: 'exercise' }]
        // }]
      });

      return results;
    } catch (error) {
      console.error(
        `Error fetching results for WorkoutExercise ${workoutExerciseId}:`,
        error
      );
      throw error; // Re-throw (could be NotFoundError, ForbiddenError)
    }
  },

  /**
   * Gets all exercise results for a specific user.
   * @param {string} userId The ID of the user.
   * @param {object} [options={}] Optional filtering/pagination options (e.g., { limit, offset, startDate, endDate })
   * @returns {Promise<ExerciseResult[]>} An array of ExerciseResult instances.
   */
  getResultsForUser: async (userId, options = {}) => {
    const { limit, offset, startDate, endDate } = options;
    const where = { user_id: userId };

    if (startDate && endDate) {
      // Assuming startDate and endDate are already validated date objects or strings
      where.completed_at = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      where.completed_at = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      where.completed_at = {
        [Op.lte]: endDate,
      };
    }

    try {
      const results = await ExerciseResult.findAll({
        where: where,
        limit: limit,
        offset: offset,
        order: [["completed_at", "DESC"]], // Most recent results first
        // Include related data to provide context
        include: [
          {
            model: WorkoutExercise,
            as: "workoutExercise",
            attributes: [
              "id",
              "order",
              "sets_planned",
              "reps_planned",
              "status",
            ], // Select relevant WE fields
            include: [
              {
                model: Exercise,
                as: "exercise",
                attributes: [
                  "id",
                  "name",
                  "target_muscle",
                  "body_part",
                  "equipment",
                ], // Select relevant Exercise fields
              },
              {
                model: WorkoutSession,
                as: "workoutSession",
                attributes: ["id", "name", "date", "status"], // Select relevant Session fields
                include: [
                  {
                    model: TrainingPlan,
                    as: "trainingPlan",
                    attributes: ["id", "name"], // Select relevant Plan fields
                  },
                ],
              },
            ],
          },
        ],
      });

      return results;
    } catch (error) {
      console.error(`Error fetching results for user ${userId}:`, error);
      throw error; // Re-throw
    }
  },
};

export { exerciseResultService, NotFoundError, ForbiddenError };
