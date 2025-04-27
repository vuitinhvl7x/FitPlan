// server/src/routers/planRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import planController from "../controllers/planController.js";
// --- Import validation ---
import handleValidationErrors from "../middlewares/validationMiddleware.js";
// import { generatePlanValidationRules } from "../validators/planValidators.js"; // TODO: Define validation rules if needed

const router = express.Router();

// --- Protected Routes (Yêu cầu đăng nhập) ---

// POST /api/plans/generate - Generate a new training plan
router.post(
  "/generate",
  authenticateToken, // User must be authenticated
  // TODO: Add validation rules here if the request body contains parameters
  // generatePlanValidationRules,
  // handleValidationErrors, // Apply validation middleware
  planController.generateTrainingPlan // Controller function
);

// TODO: Add other plan routes here (e.g., GET /api/plans/:id, GET /api/plans/me, PUT /api/plans/:id, DELETE /api/plans/:id)

export default router;
