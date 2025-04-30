// src/validators/workoutSessionValidators.js
import { body, param } from "express-validator";

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

// TODO: Add rules for updating session notes/status if needed
