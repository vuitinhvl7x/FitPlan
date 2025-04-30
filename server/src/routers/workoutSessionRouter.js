// src/routers/workoutSessionRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import workoutSessionController from "../controllers/workoutSessionController.js";
import handleValidationErrors from "../middlewares/validationMiddleware.js";
import {
  getSessionByIdRules,
  addExerciseToSessionRules,
} from "../validators/workoutSessionValidators.js"; // Create this file

const router = express.Router();

// --- Protected Routes ---

// GET /api/workout-sessions/:sessionId - Get session details
router.get(
  "/:sessionId",
  authenticateToken,
  getSessionByIdRules, // Validate sessionId param
  handleValidationErrors,
  workoutSessionController.getSessionById
);

// POST /api/workout-sessions/:sessionId/exercises - Add exercise to session
router.post(
  "/:sessionId/exercises",
  authenticateToken,
  addExerciseToSessionRules, // Validate sessionId param and body data
  handleValidationErrors,
  workoutSessionController.addExerciseToSession
);

// TODO: Add routes for updating session notes/status if needed

export default router;
