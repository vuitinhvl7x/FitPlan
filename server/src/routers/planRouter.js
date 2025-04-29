// server/src/routers/planRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import planController from "../controllers/planController.js";
import handleValidationErrors from "../middlewares/validationMiddleware.js";
// Import new validators
import {
  updatePlanStatusRules,
  getPlanByIdRules,
} from "../validators/planValidators.js"; // Create/Update this file

const router = express.Router();

// --- Protected Routes (Yêu cầu đăng nhập) ---

// POST /api/plans/generate - Generate a new training plan
router.post(
  "/generate",
  authenticateToken,
  // No body validation needed for simple generation based on profile
  planController.generateTrainingPlan
);

// GET /api/plans/me - Get all plans for the current user
router.get(
  "/me",
  authenticateToken,
  planController.getUserPlans // No validation needed
);

// GET /api/plans/:planId - Get details of a specific plan
router.get(
  "/:planId",
  authenticateToken,
  getPlanByIdRules, // Validate planId param
  handleValidationErrors,
  planController.getPlanById
);

// PUT /api/plans/:planId - Update plan status
router.put(
  "/:planId",
  authenticateToken,
  updatePlanStatusRules, // Validate planId param and status in body
  handleValidationErrors,
  planController.updatePlanStatus
);

// DELETE /api/plans/:planId - TODO: Add route for deleting/archiving a plan if needed

export default router;
