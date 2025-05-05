// src/routers/workoutSessionRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import workoutSessionController from "../controllers/workoutSessionController.js";
import handleValidationErrors from "../middlewares/validationMiddleware.js";
import {
  getSessionByIdRules,
  addExerciseToSessionRules,
  updateSessionStatusRules, // <-- Import new validation rules
} from "../validators/workoutSessionValidators.js";

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

// --- NEW: PUT /api/workout-sessions/:sessionId/status - Update session status manually ---
router.put(
  "/:sessionId/status",
  authenticateToken,
  updateSessionStatusRules, // Validate sessionId param and status in body
  handleValidationErrors,
  workoutSessionController.updateSessionStatus
);
// --- END NEW ---

// TODO: Add routes for updating session notes if needed

export default router;
