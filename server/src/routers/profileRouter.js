import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import profileController from "../controllers/profileController.js";

const router = express.Router();

// --- Protected Routes ---
// Lấy profile của user hiện tại
router.get("/me", authenticateToken, profileController.getProfileMe);

// Cập nhật profile của user hiện tại
router.put("/me", authenticateToken, profileController.updateProfileMe);

export default router;
