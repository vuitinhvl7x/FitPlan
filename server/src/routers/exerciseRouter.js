// src/routers/exerciseRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import exerciseController from "../controllers/exerciseController.js";
// --- Import validation ---
import handleValidationErrors from "../middlewares/validationMiddleware.js"; // Middleware xử lý lỗi
import {
  createExerciseValidationRules,
  updateExerciseValidationRules,
} from "../validators/exerciseValidators.js"; // Các quy tắc cụ thể

const router = express.Router();

// --- Protected Routes (Yêu cầu đăng nhập) ---

// GET /api/exercises - Lấy danh sách bài tập (có filter, pagination)
// Route này không cần validation body, chỉ có thể có query params (validation tùy chọn)
router.get("/", authenticateToken, exerciseController.getExercises);

// GET /api/exercises/:id - Lấy chi tiết một bài tập theo ID
// Cần validate ID trong params
router.get(
  "/:id",
  authenticateToken,
  // Validation cho param 'id'
  handleValidationErrors, // Xử lý lỗi validation param
  exerciseController.getExerciseById
);

// POST /api/exercises - Tạo bài tập tùy chỉnh mới
router.post(
  "/",
  authenticateToken,
  createExerciseValidationRules, // Áp dụng validation cho tạo mới
  handleValidationErrors, // Xử lý lỗi validation body
  exerciseController.createExercise
);

// PUT /api/exercises/:id - Cập nhật bài tập tùy chỉnh theo ID
// Cần validate ID trong params VÀ body
router.put(
  "/:id",
  authenticateToken,
  updateExerciseValidationRules, // Áp dụng validation cho cập nhật (bao gồm param id và body)
  handleValidationErrors, // Xử lý lỗi validation param/body
  exerciseController.updateExercise
);

// DELETE /api/exercises/:id - Xóa bài tập tùy chỉnh theo ID
// Cần validate ID trong params
router.delete(
  "/:id",
  authenticateToken,
  // Validation cho param 'id'
  handleValidationErrors, // Xử lý lỗi validation param
  exerciseController.deleteExercise
);

export default router;
