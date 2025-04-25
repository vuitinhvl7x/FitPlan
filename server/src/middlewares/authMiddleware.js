// src/middlewares/authMiddleware.js (sửa đổi)
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/index.js";

dotenv.config();

const authenticateToken = async (req, res, next) => {
  const token = req.cookies.jwt; // Đọc token từ cookie

  if (!token) {
    // Có thể trả về 401 hoặc cho qua nếu một số route không yêu cầu login
    return res
      .status(401)
      .json({ message: "Unauthorized: No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId); // Đảm bảo key trong payload là userId

    if (!user) {
      // Token hợp lệ nhưng user không tồn tại (hiếm khi xảy ra)
      res.clearCookie("jwt"); // Xóa cookie không hợp lệ
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    req.user = user; // Gắn toàn bộ object user (hoặc chỉ id/thông tin cần thiết) vào req
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    res.clearCookie("jwt"); // Xóa cookie nếu token không hợp lệ/hết hạn
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized: Token expired." });
    }
    return res.status(403).json({ message: "Forbidden: Invalid token." });
  }
};

export default authenticateToken;
