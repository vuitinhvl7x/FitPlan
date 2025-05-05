// src/controllers/userDailyConditionController.js
import {
  userDailyConditionService,
  NotFoundError,
} from "../services/userDailyConditionService.js"; // Create this service

const userDailyConditionController = {
  /**
   * POST /api/daily-conditions
   * Logs a user's daily condition for a specific date.
   */
  createDailyCondition: async (req, res) => {
    const userId = req.user.id;
    const conditionData = req.body; // { date, sleep_hours, energy_level, ... }

    try {
      const newCondition = await userDailyConditionService.createCondition(
        userId,
        conditionData
      );
      res.status(201).json({
        message: "Daily condition logged successfully!",
        condition: newCondition,
      });
    } catch (error) {
      console.error("Create Daily Condition Error:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          message: "Condition for this date already exists. Use PUT to update.",
        });
      }
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: "Validation Error", errors: messages });
      }
      res.status(500).json({
        message: "Error logging daily condition",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/daily-conditions
   * Gets a user's daily conditions, optionally filtered by date range.
   */
  getDailyConditions: async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query; // Optional query parameters

    try {
      const conditions = await userDailyConditionService.getConditions(
        userId,
        startDate,
        endDate
      );
      res.status(200).json(conditions);
    } catch (error) {
      console.error("Get Daily Conditions Error:", error);
      res.status(500).json({
        message: "Error fetching daily conditions",
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/daily-conditions/:date
   * Updates a user's daily condition for a specific date.
   */
  updateDailyCondition: async (req, res) => {
    const userId = req.user.id;
    const { date } = req.params; // Date from URL param
    const updateData = req.body; // { sleep_hours?, energy_level?, ... }

    try {
      const updatedCondition = await userDailyConditionService.updateCondition(
        userId,
        date,
        updateData
      );
      res.status(200).json({
        message: "Daily condition updated successfully!",
        condition: updatedCondition,
      });
    } catch (error) {
      console.error("Update Daily Condition Error:", error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: "Validation Error", errors: messages });
      }
      res.status(500).json({
        message: "Error updating daily condition",
        error: error.message,
      });
    }
  },
};

export default userDailyConditionController;
