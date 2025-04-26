// src/middlewares/uploadMiddleware.js
import multer from "multer";
import path from "path";

// Cấu hình lưu trữ tạm thời trong bộ nhớ
const storage = multer.memoryStorage();

// Hàm kiểm tra loại file (chỉ chấp nhận ảnh)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Error: File upload only supports the following filetypes - " +
          allowedTypes
      ),
      false
    );
  }
};

// Giới hạn kích thước file (ví dụ: 5MB)
const limits = {
  fileSize: 5 * 1024 * 1024, // 5 MB
};

// Tạo middleware multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

export default upload;
