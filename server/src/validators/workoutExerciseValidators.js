// src/validators/workoutExerciseValidators.js
import { body, param } from "express-validator";

export const updateWorkoutExerciseRules = [
  param("workoutExerciseId")
    .isUUID()
    .withMessage("Invalid workout exercise ID format"),
  // Body fields are optional for update, but validate if present
  body("sets_planned")
    .optional({ nullable: true })
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

export const swapExerciseRules = [
  param("workoutExerciseId")
    .isUUID()
    .withMessage("Invalid workout exercise ID format"),
  body("newExerciseId")
    .notEmpty()
    .withMessage("newExerciseId is required in the body")
    .isUUID()
    .withMessage("Invalid new exercise ID format"),
];

export const deleteWorkoutExerciseRules = [
  param("workoutExerciseId")
    .isUUID()
    .withMessage("Invalid workout exercise ID format"),
];
