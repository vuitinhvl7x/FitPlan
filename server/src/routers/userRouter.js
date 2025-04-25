import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import userController from "../controllers/userController.js";

const router = express.Router();

// --- Protected Routes ---
// Lấy thông tin user hiện tại
router.get("/me", authenticateToken, userController.getMe);

// Cập nhật thông tin user hiện tại
router.put("/me", authenticateToken, userController.updateMe);

// Có thể thêm các route khác liên quan đến user ở đây (vd: admin routes)

export default router;
