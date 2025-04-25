// src/routers/authRouter.js
import express from "express";
import authController from "../controllers/authController.js";
import authenticateToken from "../middlewares/authMiddleware.js"; // <-- Import middleware

const router = express.Router();

// --- Public Routes ---
// Route cho đăng ký người dùng mới
router.post("/register", authController.register);

// Route cho đăng nhập
router.post("/login", authController.login);

// --- Protected Routes ---
// Route cho đăng xuất (Yêu cầu token để biết ai đang logout và xóa cookie của họ)
router.post("/logout", authenticateToken, authController.logout); // <-- Thêm route logout

// Route để lấy thông tin user đang đăng nhập
router.get("/me", authenticateToken, authController.getMe); // <-- Thêm route getMe

// (Có thể thêm các route khác sau: forgot password, reset password,...)

export default router;
