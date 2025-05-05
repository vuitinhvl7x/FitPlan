// src/services/userDailyConditionService.js
import { sequelize, UserDailyCondition } from "../models/index.js";
import { Op } from "sequelize";
import { parseISO, isValid } from "date-fns"; // Vẫn cần isValid

// --- Custom Error Classes ---
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.status = 404;
  }
}
// --- End Custom Error Classes ---

const userDailyConditionService = {
  /**
   * Creates a new daily condition record for a user.
   * @param {string} userId The ID of the user.
   * @param {object} conditionData Data for the condition (date, sleep_hours, etc.).
   * @returns {Promise<UserDailyCondition>} The newly created condition record.
   */
  createCondition: async (userId, conditionData) => {
    const transaction = await sequelize.transaction();
    try {
      // Validate date format and ensure it's a valid date
      // REMOVE: const date = parseISO(conditionData.date);
      const date = conditionData.date; // <-- Use the Date object provided by the validator

      if (!isValid(date)) {
        // <-- Check if the Date object is valid (redundant if validator is perfect, but safer)
        // This error should ideally not be hit if validator works correctly
        throw new Error("Invalid date object provided after validation.");
      }

      // Sequelize unique constraint will handle the check for existing record for this date/user
      const newCondition = await UserDailyCondition.create(
        {
          user_id: userId,
          date: date, // Store the validated Date object
          sleep_hours: conditionData.sleep_hours,
          sleep_quality: conditionData.sleep_quality,
          energy_level: conditionData.energy_level,
          stress_level: conditionData.stress_level,
          muscle_soreness: conditionData.muscle_soreness,
          notes: conditionData.notes,
        },
        { transaction }
      );

      await transaction.commit();
      return newCondition;
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating daily condition:", error);
      throw error; // Re-throw for controller
    }
  },

  /**
   * Gets daily condition records for a user, optionally filtered by date range.
   * @param {string} userId The ID of the user.
   * @param {string} [startDate] Optional start date string (YYYY-MM-DD).
   * @param {string} [endDate] Optional end date string (YYYY-MM-DD).
   * @returns {Promise<UserDailyCondition[]>} An array of condition records.
   */
  getConditions: async (userId, startDate, endDate) => {
    const where = { user_id: userId };

    // Note: For GET query params, express-validator's .toDate() works on req.query
    // So startDate and endDate *might* already be Date objects if validator is applied to query.
    // Let's assume validator is applied to query params and they are Date objects or undefined.
    // If validator is NOT applied to query params, you would need parseISO here.
    // Based on your router, getDailyConditionsRules *is* applied to query params.

    if (startDate && endDate) {
      // startDate and endDate are Date objects from validator
      if (!isValid(startDate) || !isValid(endDate)) {
        // This check is important if validator allows invalid date strings that .toDate() converts to "Invalid Date"
        throw new Error("Invalid date range provided after validation.");
      }
      where.date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      if (!isValid(startDate)) {
        throw new Error("Invalid start date provided after validation.");
      }
      where.date = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      if (!isValid(endDate)) {
        throw new Error("Invalid end date provided after validation.");
      }
      where.date = {
        [Op.lte]: endDate,
      };
    }

    try {
      const conditions = await UserDailyCondition.findAll({
        where: where,
        order: [["date", "DESC"]], // Get most recent first
      });
      return conditions;
    } catch (error) {
      console.error("Error fetching daily conditions:", error);
      throw error; // Re-throw
    }
  },

  /**
   * Updates a daily condition record for a user on a specific date.
   * @param {string} userId The ID of the user.
   * @param {Date} dateObject The Date object for the record to update (provided by validator).
   * @param {object} updateData Data to update (sleep_hours?, energy_level?, etc.).
   * @returns {Promise<UserDailyCondition>} The updated condition record.
   */
  updateCondition: async (userId, dateObject, updateData) => {
    // Renamed parameter for clarity
    const transaction = await sequelize.transaction();
    try {
      // REMOVE: const date = parseISO(dateString);
      const date = dateObject; // <-- Use the Date object provided by the validator

      if (!isValid(date)) {
        // <-- Check if the Date object is valid
        // This error should ideally not be hit if validator works correctly
        throw new Error(
          "Invalid date object provided for update after validation."
        );
      }

      const condition = await UserDailyCondition.findOne({
        where: {
          user_id: userId,
          date: date, // Use the validated Date object
        },
        transaction,
      });

      if (!condition) {
        // Format date back to string for the error message if needed
        const dateString = format(date, "yyyy-MM-dd");
        throw new NotFoundError(
          `Daily condition not found for date ${dateString}.`
        );
      }

      // Define allowed fields to prevent unwanted updates
      const allowedUpdates = [
        "sleep_hours",
        "sleep_quality",
        "energy_level",
        "stress_level",
        "muscle_soreness",
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

      await condition.update(validUpdateData, { transaction });

      await transaction.commit();
      return condition;
    } catch (error) {
      await transaction.rollback();
      // Log error with date if possible, handle case where date might be invalid
      const logDate =
        dateObject && isValid(dateObject)
          ? format(dateObject, "yyyy-MM-dd")
          : "Invalid Date";
      console.error(
        `Error updating daily condition for date ${logDate}:`,
        error
      );
      throw error; // Re-throw
    }
  },
};

export { userDailyConditionService, NotFoundError };
