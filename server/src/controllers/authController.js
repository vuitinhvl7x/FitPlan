// src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, UserProfile } from "../models/index.js"; // Import models cần thiết
import dotenv from "dotenv";
import { generateToken } from "../utils/generateToken.js"; // Import hàm generateToken của bạn (giả sử file đặt ở src/utils)

dotenv.config(); // Load biến môi trường

const authController = {
  // --- Đăng ký ---
  register: async (req, res) => {
    const {
      fullName,
      username,
      email,
      password,
      gender,
      dateOfBirth, // User fields
      // Lấy thêm các trường bắt buộc cho UserProfile từ req.body
      activity_level,
      goals,
      experience,
      training_location,
      weight,
      height, // Profile fields (ví dụ)
      preferred_training_days, // Optional profile field
    } = req.body;

    // --- Validation cơ bản (Nên dùng thư viện validation như express-validator sau này) ---
    if (
      !fullName ||
      !username ||
      !email ||
      !password ||
      !gender ||
      !activity_level ||
      !goals ||
      !experience ||
      !training_location
    ) {
      return res
        .status(400)
        .json({ message: "Missing required fields for registration." });
    }

    try {
      // 1. Kiểm tra User/Email tồn tại
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists." });
      }
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(409).json({ message: "Username already exists." });
      }

      // 2. Tạo User mới (Password đã được hash tự động bởi set() trong model)
      const newUser = await User.create({
        fullName,
        username,
        email,
        password, // Sequelize's set() hook will hash this
        gender,
        dateOfBirth, // Đảm bảo định dạng YYYY-MM-DD
      });

      // 3. Tạo UserProfile liên kết với User vừa tạo
      // Đảm bảo bạn truyền đủ các trường bắt buộc cho UserProfile
      await UserProfile.create({
        user_id: newUser.id,
        activity_level,
        goals,
        experience,
        training_location,
        weight, // Có thể null nếu allow null trong model
        height, // Có thể null nếu allow null trong model
        preferred_training_days, // Sẽ là [] nếu không được cung cấp và có defaultValue
        // Thêm các trường profile khác nếu cần
      });

      // 4. Tạo và gửi JWT Token qua cookie
      generateToken(newUser.id, res); // Gọi hàm generateToken của bạn

      // 5. Trả về thông tin cơ bản (không trả password và token trong body)
      res.status(201).json({
        message: "User registered successfully!",
        user: {
          // Chỉ trả về thông tin cần thiết, không trả password hash
          id: newUser.id,
          fullName: newUser.fullName,
          username: newUser.username,
          email: newUser.email,
        },
      });
    } catch (error) {
      console.error("Registration Error:", error);
      // Check for Sequelize validation errors
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: "Validation Error", errors: messages });
      }
      res
        .status(500)
        .json({ message: "Error registering user", error: error.message });
    }
  },

  // --- Đăng nhập ---
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    try {
      // 1. Tìm user bằng email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials." }); // Không tìm thấy user
      }

      // 2. So sánh password (dùng bcrypt.compare)
      const isMatch = await bcrypt.compare(password, user.password); // So sánh password thô với hash trong DB
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials." }); // Sai password
      }

      // 3. Tạo và gửi JWT Token qua cookie
      generateToken(user.id, res); // Gọi hàm generateToken của bạn

      // 4. Trả về thông tin user (không trả token trong body)
      res.status(200).json({
        message: "Login successful!",
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res
        .status(500)
        .json({ message: "Error logging in", error: error.message });
    }
  },
};

export default authController;
