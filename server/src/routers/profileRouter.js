// src/routers/profileRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import profileController from "../controllers/profileController.js";
// --- Import validation ---
import handleValidationErrors from "../middlewares/validationMiddleware.js";
import { updateProfileValidationRules } from "../validators/profileValidators.js";

const router = express.Router();

// --- Protected Routes ---
// Route GET không cần validation body
router.get("/me", authenticateToken, profileController.getProfileMe);

router.put(
  "/me",
  authenticateToken, // 1. Xác thực người dùng trước
  // --- Áp dụng validation ---
  updateProfileValidationRules, // 2. Quy tắc validation cho update profile
  handleValidationErrors, // 3. Middleware xử lý lỗi validation
  // --- Controller cuối cùng ---
  profileController.updateProfileMe // 4. Chỉ chạy nếu xác thực thành công và không có lỗi validation
);

export default router;
