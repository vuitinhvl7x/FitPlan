// src/routers/exerciseResultRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import exerciseResultController from "../controllers/exerciseResultController.js";
import handleValidationErrors from "../middlewares/validationMiddleware.js";
import {
  logExerciseResultRules,
  getResultsForWorkoutExerciseRules,
  getUserResultsRules, // Optional: Add validation for query params
} from "../validators/exerciseResultValidators.js";

const router = express.Router();

// --- Protected Routes ---

// GET /api/exercise-results/me - Get all exercise results for the current user
router.get(
  "/me",
  authenticateToken,
  getUserResultsRules, // Validate query params (optional)
  handleValidationErrors, // Handle validation errors for query params
  exerciseResultController.getUserResults
);

// POST /api/exercise-results/:workoutExerciseId - Log a result for a specific exercise instance
router.post(
  "/:workoutExerciseId", // Changed path from /:workoutExerciseId/results
  authenticateToken,
  logExerciseResultRules, // Validate ID param and body data
  handleValidationErrors,
  exerciseResultController.logResult
);

// GET /api/exercise-results/:workoutExerciseId - Get all results for a specific exercise instance
router.get(
  "/:workoutExerciseId",
  authenticateToken,
  getResultsForWorkoutExerciseRules, // Validate ID param
  handleValidationErrors,
  exerciseResultController.getResultsForWorkoutExercise
);

export default router;
