// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/index.js";

dotenv.config();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Lấy token từ header 'Bearer TOKEN'

  if (token == null) {
    return res.sendStatus(401); // Không có token
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tùy chọn: Kiểm tra xem user trong token có thực sự tồn tại trong DB không
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = decoded; // Gắn thông tin user (từ payload của token) vào request
    next(); // Cho phép request đi tiếp tới route handler
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired." });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid token." });
    }
    return res.sendStatus(403); // Token không hợp lệ hoặc hết hạn
  }
};

export default authenticateToken;
