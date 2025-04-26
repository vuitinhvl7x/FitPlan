// src/validators/profileValidators.js
import { body } from "express-validator";
import { UserProfile } from "../models/index.js";

const activityLevels = UserProfile.getAttributes().activity_level.values;
const goals = UserProfile.getAttributes().goals.values;
const experiences = UserProfile.getAttributes().experience.values;

export const updateProfileValidationRules = [
  // Các trường là optional, nhưng nếu có thì phải hợp lệ
  body("activity_level")
    .optional()
    .isIn(activityLevels)
    .withMessage("Invalid activity level"),
  body("goals").optional().isIn(goals).withMessage("Invalid goal"),
  body("experience")
    .optional()
    .isIn(experiences)
    .withMessage("Invalid experience level"),
  body("training_location")
    .optional()
    .notEmpty()
    .withMessage("Training location cannot be empty")
    .trim(),
  body("preferred_training_days")
    .optional()
    .isArray()
    .withMessage("Preferred training days must be an array"),
  body("preferred_training_days.*")
    .optional()
    .isString()
    .withMessage("Each preferred day must be a string"),
  body("wants_pre_workout_info")
    .optional()
    .isBoolean()
    .withMessage("Wants pre-workout info must be true or false"),
  body("weight")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Weight must be a non-negative number"),
  body("height")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Height must be a non-negative number"),
];
