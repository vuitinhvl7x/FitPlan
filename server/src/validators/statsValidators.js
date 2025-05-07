// src/validators/statsValidators.js
import { query, param, body } from "express-validator"; // Import body

// Common date range and grouping validators (Giữ nguyên)
const dateRangeValidators = [
  query("startDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("startDate must be in YYYY-MM-DD format"),
  query("endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("endDate must be in YYYY-MM-DD format"),
  // Optional: Add custom validation to ensure endDate is not before startDate
];

const groupByValidator = query("groupBy")
  .optional()
  .isIn(["day", "week", "month", "year"])
  .withMessage("groupBy must be one of: day, week, month, year");

// Specific validators for different stats endpoints (Giữ nguyên các rules cũ)

// Performance Progress (by Exercise)
export const getExercisePerformanceStatsRules = [
  param("exerciseId").isUUID().withMessage("Invalid exercise ID format"),
  ...dateRangeValidators,
  groupByValidator,
  query("metric")
    .optional()
    .isIn(["maxWeight", "avgReps", "totalVolume", "avgDuration"])
    .withMessage(
      "metric must be one of: maxWeight, avgReps, totalVolume, avgDuration"
    ),
];

// Workout Frequency & Session Completion
export const getSessionStatsRules = [
  ...dateRangeValidators,
  groupByValidator,
  query("status")
    .optional()
    .isIn(["Planned", "Completed", "Skipped"])
    .withMessage("status must be one of: Planned, Completed, Skipped"),
];

// Plan Completion
export const getPlanCompletionStatsRules = [...dateRangeValidators];

// Daily Condition Trends
export const getDailyConditionStatsRules = [
  ...dateRangeValidators,
  groupByValidator,
  query("metric")
    .optional()
    .isIn([
      "sleepHours",
      "sleepQuality",
      "energyLevel",
      "stressLevel",
      "muscleSoreness",
    ])
    .withMessage(
      "metric must be one of: sleepHours, sleepQuality, energyLevel, stressLevel, muscleSoreness"
    ),
];

// Measurement History (GET rules - Giữ nguyên)
export const getUserMeasurementHistoryRules = [
  ...dateRangeValidators,
  query("metric")
    .optional()
    .isIn(["weight", "height"])
    .withMessage("metric must be one of: weight, height"),
];

// --- NEW: Validation rules for creating a measurement ---
export const createMeasurementRules = [
  body("date")
    .isISO8601()
    .toDate() // Convert to Date object
    .withMessage("Date is required and must be in YYYY-MM-DD format"),
  body("weight")
    .optional({ nullable: true }) // Allow null
    .isFloat({ min: 0 })
    .withMessage("Weight must be a non-negative number"),
  body("height")
    .optional({ nullable: true }) // Allow null
    .isFloat({ min: 0 })
    .withMessage("Height must be a non-negative number"),
  // Custom validation: Ensure at least weight or height is provided
  body()
    .custom((value, { req }) => {
      if (value.weight === undefined && value.height === undefined) {
        throw new Error("Either weight or height must be provided.");
      }
      // Check if both are null/undefined
      if (value.weight === null && value.height === null) {
        throw new Error("Weight and height cannot both be null.");
      }
      return true;
    })
    .withMessage("Either weight or height must be provided and not both null."), // Add message to the custom validation
  body("notes")
    .optional({ nullable: true }) // Allow null
    .isString()
    .withMessage("Notes must be a string")
    .trim(),
];
// --- END NEW ---
