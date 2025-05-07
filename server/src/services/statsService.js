// src/services/statsService.js
import {
  sequelize,
  UserMeasurement,
  ExerciseResult,
  WorkoutSession,
  UserDailyCondition,
  Exercise, // Needed for join
  WorkoutExercise, // Needed for join
  TrainingPlan, // Needed for join
} from "../models/index.js";
import { Op } from "sequelize";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from "date-fns"; // For date calculations if needed, or rely on DB functions
import { isValid } from "date-fns"; // Import isValid

// Helper to get the appropriate Sequelize function for date grouping
// This is PostgreSQL specific. Adjust if using a different DB.
const _getDateGrouping = (groupBy) => {
  switch (groupBy) {
    case "day":
      return sequelize.fn("date_trunc", "day", sequelize.col("date")); // For UserMeasurement, UserDailyCondition, WorkoutSession
    case "week":
      return sequelize.fn("date_trunc", "week", sequelize.col("date"));
    case "month":
      return sequelize.fn("date_trunc", "month", sequelize.col("date"));
    case "year":
      return sequelize.fn("date_trunc", "year", sequelize.col("date"));
    default:
      // If no grouping or invalid, group by the date itself
      return sequelize.col("date");
  }
};

// Helper for ExerciseResult completed_at grouping (timestamp)
const _getTimestampGrouping = (groupBy) => {
  switch (groupBy) {
    case "day":
      return sequelize.fn("date_trunc", "day", sequelize.col("completed_at"));
    case "week":
      return sequelize.fn("date_trunc", "week", sequelize.col("completed_at"));
    case "month":
      return sequelize.fn("date_trunc", "month", sequelize.col("completed_at"));
    case "year":
      return sequelize.fn("date_trunc", "year", sequelize.col("completed_at"));
    default:
      // If no grouping or invalid, group by day by default for performance
      return sequelize.fn("date_trunc", "day", sequelize.col("completed_at"));
  }
};

const statsService = {
  /**
   * Creates a new user measurement record.
   * @param {string} userId The ID of the user.
   * @param {object} measurementData Data for the measurement (date, weight, height, notes).
   * @returns {Promise<UserMeasurement>} The newly created measurement record.
   */
  createMeasurement: async (userId, measurementData) => {
    const transaction = await sequelize.transaction();
    try {
      // The date is already validated and converted to a Date object by the validator
      const date = measurementData.date;

      if (!isValid(date)) {
        // Safety check, should be valid if validator passed
        throw new Error("Invalid date object provided after validation.");
      }

      const newMeasurement = await UserMeasurement.create(
        {
          user_id: userId,
          date: date, // Use the validated Date object
          weight: measurementData.weight,
          height: measurementData.height,
          notes: measurementData.notes,
          // createdAt and updatedAt are handled by timestamps: true in the model
        },
        { transaction }
      );

      await transaction.commit();
      return newMeasurement;
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating measurement:", error);
      // Re-throw the error for the controller to handle (e.g., SequelizeValidationError)
      throw error;
    }
  },

  /**
   * Gets historical weight and height data for a user.
   * @param {string} userId
   * @param {object} options { startDate, endDate, metric }
   * @returns {Promise<Array<object>>} Array of measurement records.
   */
  getUserMeasurementHistory: async (userId, options = {}) => {
    const { startDate, endDate, metric } = options;
    const where = { user_id: userId };

    if (startDate && endDate) {
      // startDate and endDate are Date objects from validator
      if (!isValid(startDate) || !isValid(endDate)) {
        throw new Error("Invalid date range provided after validation.");
      }
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      if (!isValid(startDate)) {
        throw new Error("Invalid start date provided after validation.");
      }
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      if (!isValid(endDate)) {
        throw new Error("Invalid end date provided after validation.");
      }
      where.date = { [Op.lte]: endDate };
    }

    // Select only the requested metric if specified, plus date and id
    const attributes = ["id", "date"];
    if (metric === "weight" || !metric) attributes.push("weight");
    if (metric === "height" || !metric) attributes.push("height");

    try {
      const measurements = await UserMeasurement.findAll({
        where: where,
        attributes: attributes,
        order: [["date", "ASC"]], // Show chronological order
      });
      return measurements; // Returns array of UserMeasurement instances (or raw objects if raw: true)
    } catch (error) {
      console.error(
        `Error fetching user measurement history for user ${userId}:`,
        error
      );
      throw new Error("Failed to fetch measurement history.");
    }
  },

  /**
   * Gets aggregated performance stats for a specific exercise.
   * @param {string} userId
   * @param {string} exerciseId
   * @param {object} options { startDate, endDate, metric, groupBy }
   * @returns {Promise<Array<object>>} Aggregated stats data.
   */
  getExercisePerformanceStats: async (userId, exerciseId, options = {}) => {
    const { startDate, endDate, metric, groupBy = "day" } = options; // Default to day grouping
    const where = { user_id: userId };

    if (startDate && endDate) {
      where.completed_at = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.completed_at = { [Op.gte]: startDate };
    } else if (endDate) {
      where.completed_at = { [Op.lte]: endDate };
    }

    // Ensure the results belong to the specified exercise via WorkoutExercise
    where["$workoutExercise.exercise_id$"] = exerciseId;

    const grouping = _getTimestampGrouping(groupBy); // Use timestamp grouping helper

    // Define attributes for aggregation based on the requested metric
    const attributes = [
      [grouping, "time_period"], // Grouping column
      [sequelize.fn("COUNT", sequelize.col("ExerciseResult.id")), "total_sets"], // Count total sets logged
    ];

    if (metric === "maxWeight" || !metric) {
      attributes.push([
        sequelize.fn("MAX", sequelize.col("weight_used")),
        "max_weight",
      ]);
    }
    if (metric === "avgReps" || !metric) {
      attributes.push([
        sequelize.fn("AVG", sequelize.col("reps_completed")),
        "average_reps",
      ]);
    }
    if (metric === "avgDuration" || !metric) {
      attributes.push([
        sequelize.fn("AVG", sequelize.col("duration_completed")),
        "average_duration",
      ]);
    }
    // Total Volume (Sum of weight * reps for each set) - requires more complex calculation or client-side aggregation from raw sets
    // For simplicity, let's calculate total volume per set and then sum it up per period
    // This might be better done by fetching sets and calculating volume on client or in a separate query
    // A simpler approach for backend aggregation is SUM(weight_used) * AVG(reps_completed) which is an estimate, or SUM(weight_used * reps_completed) if you store that per set.
    // Let's stick to MAX weight, AVG reps, AVG duration for now as direct aggregations.

    try {
      const stats = await ExerciseResult.findAll({
        attributes: attributes,
        where: where,
        include: [
          {
            model: WorkoutExercise,
            as: "workoutExercise",
            attributes: [], // Don't select WE attributes, just use for join
            required: true, // Inner join to ensure it's linked to a WE
          },
          // No need to include Exercise here, already filtered by exercise_id via WE
        ],
        group: [grouping], // Group by the time period
        order: [[grouping, "ASC"]], // Order by time period
        raw: true, // Return raw data instead of model instances
      });

      // Post-processing for totalVolume if needed, or calculate on frontend
      // For now, return the raw aggregated data
      return stats;
    } catch (error) {
      console.error(
        `Error fetching exercise performance stats for user ${userId}, exercise ${exerciseId}:`,
        error
      );
      throw new Error("Failed to fetch exercise performance stats.");
    }
  },

  /**
   * Gets aggregated workout session stats (frequency and completion counts).
   * @param {string} userId
   * @param {object} options { startDate, endDate, groupBy, status }
   * @returns {Promise<Array<object>>} Aggregated stats data.
   */
  getWorkoutSessionStats: async (userId, options = {}) => {
    const { startDate, endDate, groupBy = "week", status } = options; // Default to week grouping for sessions
    const where = {};

    // Filter by date range on session date
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    // Filter by status if specified
    if (status) {
      where.status = status;
    }

    const grouping = _getDateGrouping(groupBy); // Use date grouping helper

    const attributes = [
      [grouping, "time_period"], // Grouping column
      [
        sequelize.fn("COUNT", sequelize.col("WorkoutSession.id")),
        "total_sessions",
      ], // Count sessions in the period
      // Add counts for specific statuses within the group
      [
        sequelize.fn(
          "COUNT",
          sequelize.literal(
            'CASE WHEN "WorkoutSession"."status" = \'Completed\' THEN 1 ELSE NULL END'
          )
        ),
        "completed_count",
      ],
      [
        sequelize.fn(
          "COUNT",
          sequelize.literal(
            'CASE WHEN "WorkoutSession"."status" = \'Skipped\' THEN 1 ELSE NULL END'
          )
        ),
        "skipped_count",
      ],
      [
        sequelize.fn(
          "COUNT",
          sequelize.literal(
            'CASE WHEN "WorkoutSession"."status" = \'Planned\' THEN 1 ELSE NULL END'
          )
        ),
        "planned_count",
      ],
    ];

    try {
      const stats = await WorkoutSession.findAll({
        attributes: attributes,
        where: where,
        include: [
          {
            model: TrainingPlan,
            as: "trainingPlan",
            attributes: [], // Don't select plan attributes
            where: { user_id: userId }, // Ensure session belongs to user's plan
            required: true, // Inner join
          },
        ],
        group: [grouping], // Group by the time period
        order: [[grouping, "ASC"]], // Order by time period
        raw: true, // Return raw data
      });

      // Calculate completion rate on frontend or add another aggregation here
      // For now, return counts. Frontend can calculate rate.
      return stats;
    } catch (error) {
      console.error(
        `Error fetching workout session stats for user ${userId}:`,
        error
      );
      throw new Error("Failed to fetch workout session stats.");
    }
  },

  /**
   * Gets aggregated daily condition stats.
   * @param {string} userId
   * @param {object} options { startDate, endDate, metric, groupBy }
   * @returns {Promise<Array<object>>} Aggregated stats data.
   */
  getDailyConditionStats: async (userId, options = {}) => {
    const { startDate, endDate, metric, groupBy = "day" } = options; // Default to day grouping
    const where = { user_id: userId };

    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    const grouping = _getDateGrouping(groupBy); // Use date grouping helper

    const attributes = [
      [grouping, "time_period"], // Grouping column
      [
        sequelize.fn("COUNT", sequelize.col("UserDailyCondition.id")),
        "total_entries",
      ], // Count entries in the period
    ];

    // Add average aggregations for specified or all metrics
    const metricsToAggregate = metric
      ? [metric]
      : [
          "sleep_hours",
          "sleep_quality",
          "energy_level",
          "stress_level",
          "muscle_soreness",
        ];

    metricsToAggregate.forEach((m) => {
      // Ensure the column exists and is numeric before aggregating
      if (
        [
          "sleep_hours",
          "sleep_quality",
          "energy_level",
          "stress_level",
          "muscle_soreness",
        ].includes(m)
      ) {
        attributes.push([
          sequelize.fn("AVG", sequelize.col(m)),
          `average_${m}`,
        ]);
      }
    });

    try {
      const stats = await UserDailyCondition.findAll({
        attributes: attributes,
        where: where,
        group: [grouping], // Group by the time period
        order: [[grouping, "ASC"]], // Order by time period
        raw: true, // Return raw data
      });

      return stats;
    } catch (error) {
      console.error(
        `Error fetching daily condition stats for user ${userId}:`,
        error
      );
      throw new Error("Failed to fetch daily condition stats.");
    }
  },

  /**
   * Gets aggregated plan completion stats.
   * This typically counts plans by status within a date range based on their end_date.
   * @param {string} userId
   * @param {object} options { startDate, endDate }
   * @returns {Promise<object>} Counts of plans by status.
   */
  getPlanCompletionStats: async (userId, options = {}) => {
    const { startDate, endDate } = options;
    const where = { user_id: userId };

    // Filter by date range on plan end_date
    if (startDate && endDate) {
      where.end_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.end_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.end_date = { [Op.lte]: endDate };
    }

    try {
      const stats = await TrainingPlan.findAll({
        attributes: [
          "status", // Group by status
          [sequelize.fn("COUNT", sequelize.col("TrainingPlan.id")), "count"], // Count plans in each status
        ],
        where: where,
        group: ["status"], // Group by status
        raw: true, // Return raw data
      });

      // Format the result into a more convenient object { Completed: 5, Skipped: 2, ... }
      const formattedStats = stats.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count, 10); // Ensure count is a number
        return acc;
      }, {});

      return formattedStats;
    } catch (error) {
      console.error(
        `Error fetching plan completion stats for user ${userId}:`,
        error
      );
      throw new Error("Failed to fetch plan completion stats.");
    }
  },

  // Note: getWorkoutSessionStats already provides session completion counts per period.
  // You could add a separate endpoint/service method if you need overall session completion rate
  // across all sessions regardless of plan or grouping.
};

export { statsService };
