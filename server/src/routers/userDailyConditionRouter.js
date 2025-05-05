// src/routers/userDailyConditionRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import userDailyConditionController from "../controllers/userDailyConditionController.js";
import handleValidationErrors from "../middlewares/validationMiddleware.js";
import {
  createDailyConditionRules,
  getDailyConditionsRules, // Optional: Add validation for query params
  updateDailyConditionRules,
} from "../validators/userDailyConditionValidators.js"; // Create this file

const router = express.Router();

// --- Protected Routes ---

// POST /api/daily-conditions - Log a new daily condition
router.post(
  "/",
  authenticateToken,
  createDailyConditionRules, // Validate body data
  handleValidationErrors,
  userDailyConditionController.createDailyCondition
);

// GET /api/daily-conditions - Get user's daily conditions (optional date range filter)
router.get(
  "/",
  authenticateToken,
  getDailyConditionsRules, // Validate query params (optional)
  handleValidationErrors, // Handle validation errors for query params
  userDailyConditionController.getDailyConditions
);

// PUT /api/daily-conditions/:date - Update daily condition for a specific date
router.put(
  "/:date",
  authenticateToken,
  updateDailyConditionRules, // Validate date param and body data
  handleValidationErrors,
  userDailyConditionController.updateDailyCondition
);

export default router;
