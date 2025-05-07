// src/routers/statsRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import handleValidationErrors from "../middlewares/validationMiddleware.js";
import statsController from "../controllers/statsController.js";
import {
  getUserMeasurementHistoryRules, // For GET
  createMeasurementRules, // --- NEW IMPORT --- For POST
  getExercisePerformanceStatsRules,
  getSessionStatsRules,
  getDailyConditionStatsRules,
  getPlanCompletionStatsRules,
} from "../validators/statsValidators.js";

const router = express.Router();

// All stats routes require authentication
router.use(authenticateToken);

// --- NEW ROUTE: POST /api/stats/measurements ---
router.post(
  "/measurements",
  createMeasurementRules, // Apply validation rules for POST body
  handleValidationErrors,
  statsController.createMeasurement // Use the new controller method
);

// GET /api/stats/measurements - User Measurement History (Giữ nguyên)
router.get(
  "/measurements",
  getUserMeasurementHistoryRules, // Apply validation rules for GET query params
  handleValidationErrors,
  statsController.getUserMeasurementHistory // Use the existing controller method
);

// GET /api/stats/performance/exercise/:exerciseId (Giữ nguyên)
router.get(
  "/performance/exercise/:exerciseId",
  getExercisePerformanceStatsRules,
  handleValidationErrors,
  statsController.getExercisePerformanceStats
);

// GET /api/stats/sessions (Giữ nguyên)
router.get(
  "/sessions",
  getSessionStatsRules,
  handleValidationErrors,
  statsController.getWorkoutSessionStats
);

// GET /api/stats/daily-conditions (Giữ nguyên)
router.get(
  "/daily-conditions",
  getDailyConditionStatsRules,
  handleValidationErrors,
  statsController.getDailyConditionStats
);

// GET /api/stats/completion/plans (Giữ nguyên)
router.get(
  "/completion/plans",
  getPlanCompletionStatsRules,
  handleValidationErrors,
  statsController.getPlanCompletionStats
);

export default router;
