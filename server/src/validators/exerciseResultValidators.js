// src/validators/exerciseResultValidators.js
import { body, param, query } from "express-validator";

export const logExerciseResultRules = [
  param("workoutExerciseId")
    .isUUID()
    .withMessage("Invalid workout exercise ID format"),
  body("set_number")
    .isInt({ min: 1 })
    .withMessage("Set number is required and must be a positive integer"),
  body("reps_completed")
    .optional({ nullable: true }) // Allow null if duration is used
    .isInt({ min: 0 })
    .withMessage("Reps completed must be a non-negative integer"),
  body("weight_used")
    .optional({ nullable: true }) // Allow null for bodyweight/cardio
    .isFloat({ min: 0 })
    .withMessage("Weight used must be a non-negative number"),
  body("duration_completed")
    .optional({ nullable: true }) // Allow null if reps are used
    .isInt({ min: 0 })
    .withMessage("Duration completed must be a non-negative integer (seconds)"),
  body("rating")
    .optional({ nullable: true }) // Optional field
    .isInt({ min: 1, max: 10 })
    .withMessage("Rating must be an integer between 1 and 10"),
  body("notes")
    .optional({ nullable: true }) // Optional field
    .isString()
    .withMessage("Notes must be a string")
    .trim(),
];

export const getResultsForWorkoutExerciseRules = [
  param("workoutExerciseId")
    .isUUID()
    .withMessage("Invalid workout exercise ID format"),
];

export const getUserResultsRules = [
  query("limit")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Limit must be a positive integer"),
  query("page")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Page must be a positive integer"),
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
  // Optional: Add custom validation to ensure endDate is not before startDate if both are present
];
