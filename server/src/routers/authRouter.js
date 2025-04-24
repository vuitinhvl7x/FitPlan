// src/routers/authRouter.js
import express from "express";
import authController from "../controllers/authController.js"; // Sẽ tạo file này ở bước sau

const router = express.Router();

// Route cho đăng ký người dùng mới
router.post("/register", authController.register);

// Route cho đăng nhập
router.post("/login", authController.login);

// (Có thể thêm các route khác sau: forgot password, reset password,...)

export default router;
