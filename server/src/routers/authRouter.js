// src/routers/authRouter.js
import express from "express";
import authController from "../controllers/authController.js";
import authenticateToken from "../middlewares/authMiddleware.js";
// --- Import validation ---
import handleValidationErrors from "../middlewares/validationMiddleware.js"; // Middleware xử lý lỗi
import {
  registerValidationRules,
  loginValidationRules,
} from "../validators/authValidators.js"; // Các quy tắc cụ thể

const router = express.Router();

// --- Public Routes ---
router.post(
  "/register",
  // --- Áp dụng validation ---
  registerValidationRules, // 1. Mảng các quy tắc validation cho route này
  handleValidationErrors, // 2. Middleware kiểm tra và xử lý lỗi validation
  // --- Controller cuối cùng ---
  authController.register // 3. Chỉ chạy nếu không có lỗi validation
);

router.post(
  "/login",
  // --- Áp dụng validation ---
  loginValidationRules, // 1. Quy tắc validation cho login
  handleValidationErrors, // 2. Middleware xử lý lỗi
  // --- Controller cuối cùng ---
  authController.login // 3. Chỉ chạy nếu không có lỗi validation
);

// --- Protected Routes ---
router.post("/logout", authenticateToken, authController.logout); // Route này không cần validation body

export default router;
