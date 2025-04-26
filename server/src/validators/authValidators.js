// src/validators/authValidators.js
import { body } from "express-validator";
import { UserProfile } from "../models/index.js"; // Để lấy ENUMs

// Lấy các giá trị ENUM từ model để validation
const activityLevels = UserProfile.getAttributes().activity_level.values;
const goals = UserProfile.getAttributes().goals.values;
const experiences = UserProfile.getAttributes().experience.values;
const genders = ["Male", "Female", "Other"]; // Hoặc lấy từ User model nếu định nghĩa ở đó

export const registerValidationRules = [
  body("fullName").notEmpty().withMessage("Full name is required").trim(),
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long")
    .trim(),
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("gender").isIn(genders).withMessage("Invalid gender value"),
  body("dateOfBirth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage("Invalid date of birth format (YYYY-MM-DD)"), // checkFalsy cho phép null/""

  // Profile fields (required during registration in your current logic)
  body("activity_level")
    .isIn(activityLevels)
    .withMessage("Invalid activity level"),
  body("goals").isIn(goals).withMessage("Invalid goal"),
  body("experience").isIn(experiences).withMessage("Invalid experience level"),
  body("training_location")
    .notEmpty()
    .withMessage("Training location is required")
    .trim(),
  body("weight")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Weight must be a non-negative number"),
  body("height")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Height must be a non-negative number"),
  body("preferred_training_days")
    .optional()
    .isArray()
    .withMessage("Preferred training days must be an array"),
  body("preferred_training_days.*")
    .optional()
    .isString()
    .withMessage("Each preferred day must be a string"), // Validate items within the array
];

export const loginValidationRules = [
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];
