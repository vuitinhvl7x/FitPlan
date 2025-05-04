// src/routers/workoutExerciseRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import workoutExerciseController from "../controllers/workoutExerciseController.js";
import handleValidationErrors from "../middlewares/validationMiddleware.js";
import {
  updateWorkoutExerciseRules,
  swapExerciseRules,
  deleteWorkoutExerciseRules,
} from "../validators/workoutExerciseValidators.js"; // Create this file

const router = express.Router();

// --- Protected Routes ---

// PUT /api/workout-exercises/:workoutExerciseId - Update exercise details
router.put(
  "/:workoutExerciseId",
  authenticateToken,
  updateWorkoutExerciseRules, // Validate ID param and body data
  handleValidationErrors,
  workoutExerciseController.updateWorkoutExercise
);

// PUT /api/workout-exercises/:workoutExerciseId/swap - Swap base exercise
router.put(
  "/:workoutExerciseId/swap",
  authenticateToken,
  swapExerciseRules, // Validate ID param and body data (newExerciseId)
  handleValidationErrors,
  workoutExerciseController.swapExercise
);

// DELETE /api/workout-exercises/:workoutExerciseId - Delete exercise from session
router.delete(
  "/:workoutExerciseId",
  authenticateToken,
  deleteWorkoutExerciseRules, // Validate ID param
  handleValidationErrors,
  workoutExerciseController.deleteWorkoutExercise
);

export default router;
