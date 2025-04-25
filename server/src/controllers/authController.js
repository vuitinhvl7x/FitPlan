// src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, UserProfile } from "../models/index.js";
import dotenv from "dotenv";
import { generateToken } from "../utils/generateToken.js";

dotenv.config();

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
      activity_level,
      goals,
      experience,
      training_location,
      weight,
      height, // Profile fields
      preferred_training_days,
    } = req.body;

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
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists." });
      }
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(409).json({ message: "Username already exists." });
      }

      const newUser = await User.create({
        full_name: fullName, // Ensure snake_case matches model definition
        username,
        email,
        password,
        gender,
        date_of_birth: dateOfBirth, // Ensure snake_case matches model definition
      });

      await UserProfile.create({
        user_id: newUser.id,
        activity_level,
        goals,
        experience,
        training_location,
        weight,
        height,
        preferred_training_days,
      });

      generateToken(newUser.id, res);

      res.status(201).json({
        message: "User registered successfully!",
        user: {
          id: newUser.id,
          fullName: newUser.full_name, // Use snake_case field from model
          username: newUser.username,
          email: newUser.email,
        },
      });
    } catch (error) {
      console.error("Registration Error:", error);
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
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      // Use the instance method if available, otherwise use bcrypt directly
      const isMatch = user.isValidPassword // Check if method exists
        ? await user.isValidPassword(password)
        : await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      generateToken(user.id, res);

      res.status(200).json({
        message: "Login successful!",
        user: {
          id: user.id,
          fullName: user.full_name, // Use snake_case field from model
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

  // --- Đăng xuất ---
  logout: (req, res) => {
    try {
      // Xóa cookie 'jwt'
      res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0), // Set ngày hết hạn về quá khứ
        sameSite: "strict", // Đảm bảo các tùy chọn giống như khi tạo token
        secure: process.env.NODE_ENV !== "development", // Giống như khi tạo token
      });
      res.status(200).json({ message: "Logged out successfully." });
    } catch (error) {
      console.error("Logout Error:", error);
      res
        .status(500)
        .json({ message: "Error logging out", error: error.message });
    }
  },

  // --- Lấy thông tin User hiện tại ---
  getMe: async (req, res) => {
    // Middleware authenticateToken đã xác thực và gắn user vào req.user
    try {
      // Lấy thông tin user từ req.user (đã được middleware thêm vào)
      // Chọn lọc các trường cần trả về, không bao gồm password
      const userData = {
        id: req.user.id,
        fullName: req.user.full_name, // Use snake_case field from model
        username: req.user.username,
        email: req.user.email,
        gender: req.user.gender,
        dateOfBirth: req.user.date_of_birth, // Use snake_case field from model
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
        // Bạn có thể muốn lấy thêm profile ở đây nếu cần
        // profile: await req.user.getProfile() // Ví dụ nếu có association 'profile'
      };

      res.status(200).json(userData);
    } catch (error) {
      console.error("Get Me Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching user data", error: error.message });
    }
  },
};

export default authController;
