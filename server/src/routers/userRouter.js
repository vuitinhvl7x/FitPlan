// src/routers/userRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import userController from "../controllers/userController.js";
// --- Import validation ---
import handleValidationErrors from "../middlewares/validationMiddleware.js";
import { updateUserValidationRules } from "../validators/userValidators.js";

const router = express.Router();

// --- Protected Routes ---
// Route GET không cần validation body
router.get("/me", authenticateToken, userController.getMe);

router.put(
  "/me",
  authenticateToken, // 1. Xác thực người dùng trước
  // --- Áp dụng validation ---
  updateUserValidationRules, // 2. Quy tắc validation cho update user
  handleValidationErrors, // 3. Middleware xử lý lỗi validation
  // --- Controller cuối cùng ---
  userController.updateMe // 4. Chỉ chạy nếu xác thực thành công và không có lỗi validation
);

export default router;
