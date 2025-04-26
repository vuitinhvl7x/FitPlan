// src/routers/profileRouter.js
import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import profileController from "../controllers/profileController.js";
// --- Import validation ---
import handleValidationErrors from "../middlewares/validationMiddleware.js";
import { updateProfileValidationRules } from "../validators/profileValidators.js";
import upload from "../middlewares/uploadMiddleware.js"; // <-- Import multer middleware

const router = express.Router();

// --- Protected Routes ---
// Route GET không cần validation body
router.get("/me", authenticateToken, profileController.getProfileMe);

router.put(
  "/me",
  authenticateToken, // 1. Xác thực người dùng trước
  // --- Áp dụng validation ---
  updateProfileValidationRules, // 2. Quy tắc validation cho update profile (cho các trường text)
  handleValidationErrors, // 3. Middleware xử lý lỗi validation
  // --- Controller cuối cùng ---
  profileController.updateProfileMe // 4. Chỉ chạy nếu xác thực thành công và không có lỗi validation
);

// --- Route mới cho upload/update ảnh đại diện ---
// 'profilePic' là tên của field trong form-data mà client gửi lên chứa file ảnh
router.put(
  "/me/picture", // Sử dụng PUT vì đây là hành động cập nhật profile
  authenticateToken, // 1. Xác thực user
  upload.single("profilePic"), // 2. Middleware Multer xử lý file upload có tên field là 'profilePic'
  //    Middleware này sẽ gắn file vào req.file nếu thành công
  profileController.updateProfilePicture // 3. Controller xử lý logic upload lên Cloudinary và cập nhật DB
);

export default router;
