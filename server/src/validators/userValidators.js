// src/validators/userValidators.js
import { body } from "express-validator";

const genders = ["Male", "Female", "Other"]; // Hoặc lấy từ User model

export const updateUserValidationRules = [
  // Các trường là optional, nhưng nếu có thì phải hợp lệ
  body("fullName")
    .optional()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .trim(),
  body("username")
    .optional()
    .notEmpty()
    .withMessage("Username cannot be empty")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long")
    .trim(),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("gender").optional().isIn(genders).withMessage("Invalid gender value"),
  body("dateOfBirth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage("Invalid date of birth format (YYYY-MM-DD)"),
];
