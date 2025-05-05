// src/validators/userDailyConditionValidators.js
import { body, param, query } from "express-validator";
import { UserDailyCondition } from "../models/index.js"; // To get ENUM values

// Get valid rating ranges from the model definition (example)
// Note: Sequelize doesn't store min/max for INT validation directly in attributes,
// you'd need to define these ranges based on your model definition comments or documentation.
// Assuming 1-5 for quality/level/soreness, 1-10 for rating in ExerciseResult (not used here)
const ratingMin = 1;
const ratingMax = 5;

export const createDailyConditionRules = [
  body("date")
    .isISO8601()
    .toDate()
    .withMessage("Date is required and must be in YYYY-MM-DD format"),
  body("sleep_hours")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Sleep hours must be a non-negative number"),
  body("sleep_quality")
    .optional({ nullable: true })
    .isInt({ min: ratingMin, max: ratingMax })
    .withMessage(
      `Sleep quality must be an integer between ${ratingMin} and ${ratingMax}`
    ),
  body("energy_level")
    .optional({ nullable: true })
    .isInt({ min: ratingMin, max: ratingMax })
    .withMessage(
      `Energy level must be an integer between ${ratingMin} and ${ratingMax}`
    ),
  body("stress_level")
    .optional({ nullable: true })
    .isInt({ min: ratingMin, max: ratingMax })
    .withMessage(
      `Stress level must be an integer between ${ratingMin} and ${ratingMax}`
    ),
  body("muscle_soreness")
    .optional({ nullable: true })
    .isInt({ min: ratingMin, max: ratingMax })
    .withMessage(
      `Muscle soreness must be an integer between ${ratingMin} and ${ratingMax}`
    ),
  body("notes")
    .optional({ nullable: true })
    .isString()
    .withMessage("Notes must be a string")
    .trim(),
];

export const getDailyConditionsRules = [
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

export const updateDailyConditionRules = [
  param("date")
    .isISO8601()
    .toDate()
    .withMessage("Date parameter must be in YYYY-MM-DD format"),
  // Update fields are optional, but validate if present
  body("sleep_hours")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Sleep hours must be a non-negative number"),
  body("sleep_quality")
    .optional({ nullable: true })
    .isInt({ min: ratingMin, max: ratingMax })
    .withMessage(
      `Sleep quality must be an integer between ${ratingMin} and ${ratingMax}`
    ),
  body("energy_level")
    .optional({ nullable: true })
    .isInt({ min: ratingMin, max: ratingMax })
    .withMessage(
      `Energy level must be an integer between ${ratingMin} and ${ratingMax}`
    ),
  body("stress_level")
    .optional({ nullable: true })
    .isInt({ min: ratingMin, max: ratingMax })
    .withMessage(
      `Stress level must be an integer between ${ratingMin} and ${ratingMax}`
    ),
  body("muscle_soreness")
    .optional({ nullable: true })
    .isInt({ min: ratingMin, max: ratingMax })
    .withMessage(
      `Muscle soreness must be an integer between ${ratingMin} and ${ratingMax}`
    ),
  body("notes")
    .optional({ nullable: true })
    .isString()
    .withMessage("Notes must be a string")
    .trim(),
];
