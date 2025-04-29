// server/src/validators/planValidators.js
import { body, param } from "express-validator";
import { TrainingPlan } from "../models/index.js"; // Import model to get ENUM values

// Get valid status values from the model definition
const validStatuses = TrainingPlan.getAttributes().status.values;

// Validation rules for generating a plan (if body parameters are added later)
// export const generatePlanValidationRules = [ ... ];

// Validation rules for getting a plan by ID (just validate the ID format)
export const getPlanByIdRules = [
  param("planId").isUUID().withMessage("Invalid training plan ID format"),
];

// Validation rules for updating plan status
export const updatePlanStatusRules = [
  param("planId").isUUID().withMessage("Invalid training plan ID format"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(validStatuses)
    .withMessage(
      `Invalid status value. Must be one of: ${validStatuses.join(", ")}`
    ),
];

// TODO: Add validation rules for deleting a plan if that route is added
