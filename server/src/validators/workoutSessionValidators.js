// src/validators/workoutSessionValidators.js
import { body, param } from "express-validator";
import { WorkoutSession } from "../models/index.js"; // Import model để lấy ENUM values

// Lấy các giá trị ENUM từ model để validation
const validSessionStatuses = WorkoutSession.getAttributes().status.values;

export const getSessionByIdRules = [
  param("sessionId").isUUID().withMessage("Invalid workout session ID format"),
];

export const addExerciseToSessionRules = [
  param("sessionId").isUUID().withMessage("Invalid workout session ID format"),
  body("exerciseId")
    .notEmpty()
    .withMessage("exerciseId is required")
    .isUUID()
    .withMessage("Invalid exercise ID format"),
  body("sets_planned")
    .optional({ nullable: true }) // Allow null
    .isInt({ min: 0 })
    .withMessage("Sets planned must be a non-negative integer"),
  body("reps_planned")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Reps planned must be a non-negative integer"),
  body("weight_planned")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Weight planned must be a non-negative number"),
  body("duration_planned")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Duration planned must be a non-negative integer (seconds)"),
  body("rest_period")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Rest period must be a non-negative integer (seconds)"),
  body("order")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer"),
  body("notes")
    .optional({ nullable: true })
    .isString()
    .withMessage("Notes must be a string")
    .trim(),
];

// --- NEW: Validation rules for updating session status ---
export const updateSessionStatusRules = [
  param("sessionId").isUUID().withMessage("Invalid workout session ID format"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    // Chỉ cho phép cập nhật sang Completed hoặc Skipped thủ công
    .isIn(["Completed", "Skipped"]) // <-- Restrict allowed manual statuses
    .withMessage(`Invalid status value. Must be one of: Completed, Skipped`),
];
// --- END NEW ---

// TODO: Add rules for updating session notes if needed
