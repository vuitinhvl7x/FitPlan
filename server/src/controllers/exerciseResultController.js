// src/controllers/exerciseResultController.js
import {
  exerciseResultService,
  NotFoundError,
  ForbiddenError,
} from "../services/exerciseResultService.js";

const exerciseResultController = {
  /**
   * POST /api/exercise-results/:workoutExerciseId
   * Logs a result for a specific set of a workout exercise instance.
   * (Note: Router path changed slightly for clarity, see router update below)
   */
  logResult: async (req, res) => {
    const { workoutExerciseId } = req.params;
    const userId = req.user.id; // From authenticateToken middleware
    const resultData = req.body; // { set_number, reps_completed, weight_used, ... }

    try {
      const newResult = await exerciseResultService.logResult(
        workoutExerciseId,
        userId,
        resultData
      );
      res.status(201).json({
        message: "Exercise result logged successfully!",
        result: newResult,
      });
    } catch (error) {
      console.error("Log Exercise Result Error:", error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({ message: error.message });
      }
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: "Validation Error", errors: messages });
      }
      res.status(500).json({
        message: "Error logging exercise result",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/exercise-results/:workoutExerciseId
   * Gets all results for a specific workout exercise instance.
   */
  getResultsForWorkoutExercise: async (req, res) => {
    const { workoutExerciseId } = req.params;
    const userId = req.user.id;

    try {
      const results = await exerciseResultService.getResultsForWorkoutExercise(
        workoutExerciseId,
        userId
      );
      res.status(200).json(results);
    } catch (error) {
      console.error("Get Results For Workout Exercise Error:", error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({
        message: "Error fetching exercise results",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/exercise-results/me
   * Gets all exercise results for the current user.
   */
  getUserResults: async (req, res) => {
    const userId = req.user.id;
    const { limit, page, startDate, endDate } = req.query; // Handle optional query params

    const options = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset:
        page && limit
          ? (parseInt(page, 10) - 1) * parseInt(limit, 10)
          : undefined,
      startDate: startDate, // Pass strings, service will parse/validate
      endDate: endDate,
    };

    try {
      const results = await exerciseResultService.getResultsForUser(
        userId,
        options
      );
      // TODO: If pagination is implemented in service, return total count as well
      res.status(200).json(results);
    } catch (error) {
      console.error("Get User Results Error:", error);
      if (error.message.includes("Invalid date")) {
        // Catch validation errors from service
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message: "Error fetching user exercise results",
        error: error.message,
      });
    }
  },
};

export default exerciseResultController;
