// src/middlewares/validationMiddleware.js
import { validationResult } from "express-validator";

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array(), // Trả về danh sách lỗi chi tiết
    });
  }
  next(); // Không có lỗi, tiếp tục xử lý request
};

export default handleValidationErrors;
