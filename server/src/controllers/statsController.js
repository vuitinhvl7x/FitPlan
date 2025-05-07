// src/controllers/statsController.js
import { statsService } from "../services/statsService.js";

const statsController = {
  /**
   * POST /api/stats/measurements
   * Logs a new user measurement.
   */
  createMeasurement: async (req, res) => {
    const userId = req.user.id; // From authenticateToken middleware
    const measurementData = req.body; // Validated data from createMeasurementRules

    try {
      const newMeasurement = await statsService.createMeasurement(
        userId,
        measurementData
      );
      res.status(201).json({
        message: "Measurement logged successfully!",
        measurement: newMeasurement,
      });
    } catch (error) {
      console.error("Create Measurement Error:", error);
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: "Validation Error", errors: messages });
      }
      // Handle potential unique constraint error if you add unique index on user_id, date
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          message:
            "Measurement for this date already exists. Consider updating instead.",
        });
      }
      res
        .status(500)
        .json({ message: "Error logging measurement", error: error.message });
    }
  },

  /**
   * GET /api/stats/measurements
   * Gets user measurement history.
   */
  getUserMeasurementHistory: async (req, res) => {
    const userId = req.user.id;
    const options = req.query; // Contains startDate, endDate, metric (validated by middleware)

    try {
      const data = await statsService.getUserMeasurementHistory(
        userId,
        options
      );
      res.status(200).json(data);
    } catch (error) {
      console.error("Get User Measurement History Error:", error);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * GET /api/stats/performance/exercise/:exerciseId
   * Gets aggregated performance stats for a specific exercise.
   */
  getExercisePerformanceStats: async (req, res) => {
    const userId = req.user.id;
    const { exerciseId } = req.params;
    const options = req.query; // Contains startDate, endDate, metric, groupBy (validated)

    try {
      const data = await statsService.getExercisePerformanceStats(
        userId,
        exerciseId,
        options
      );
      res.status(200).json(data);
    } catch (error) {
      console.error(
        `Get Exercise Performance Stats Error for exercise ${exerciseId}:`,
        error
      );
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * GET /api/stats/sessions
   * Gets aggregated workout session stats (frequency and completion counts).
   */
  getWorkoutSessionStats: async (req, res) => {
    const userId = req.user.id;
    const options = req.query; // Contains startDate, endDate, groupBy, status (validated)

    try {
      const data = await statsService.getWorkoutSessionStats(userId, options);
      res.status(200).json(data);
    } catch (error) {
      console.error("Get Workout Session Stats Error:", error);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * GET /api/stats/daily-conditions
   * Gets aggregated daily condition stats.
   */
  getDailyConditionStats: async (req, res) => {
    const userId = req.user.id;
    const options = req.query; // Contains startDate, endDate, metric, groupBy (validated)

    try {
      const data = await statsService.getDailyConditionStats(userId, options);
      res.status(200).json(data);
    } catch (error) {
      console.error("Get Daily Condition Stats Error:", error);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * GET /api/stats/completion/plans
   * Gets aggregated plan completion stats.
   */
  getPlanCompletionStats: async (req, res) => {
    const userId = req.user.id;
    const options = req.query; // Contains startDate, endDate (validated)

    try {
      const data = await statsService.getPlanCompletionStats(userId, options);
      res.status(200).json(data);
    } catch (error) {
      console.error("Get Plan Completion Stats Error:", error);
      res.status(500).json({ message: error.message });
    }
  },
};

export default statsController;
