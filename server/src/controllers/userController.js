// src/controllers/userController.js
import { User } from "../models/index.js";
import bcrypt from "bcrypt"; // Needed if you allow password updates (though recommended separately)

const userController = {
  // GET /api/users/me - Lấy thông tin user hiện tại
  getMe: async (req, res) => {
    // authenticateToken middleware đã gắn user vào req.user
    try {
      // Trả về thông tin user từ req.user (không bao gồm password)
      const userData = {
        id: req.user.id,
        fullName: req.user.full_name,
        username: req.user.username,
        email: req.user.email,
        gender: req.user.gender,
        dateOfBirth: req.user.date_of_birth,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      };
      res.status(200).json(userData);
    } catch (error) {
      console.error("Get Me (User) Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching user data", error: error.message });
    }
  },

  // PUT /api/users/me - Cập nhật thông tin user hiện tại
  updateMe: async (req, res) => {
    const userId = req.user.id;
    const { fullName, username, email, gender, dateOfBirth } = req.body;

    // Chỉ cho phép cập nhật các trường này
    const allowedUpdates = {};
    if (fullName !== undefined) allowedUpdates.full_name = fullName;
    if (username !== undefined) allowedUpdates.username = username;
    if (email !== undefined) allowedUpdates.email = email;
    if (gender !== undefined) allowedUpdates.gender = gender;
    if (dateOfBirth !== undefined) allowedUpdates.date_of_birth = dateOfBirth;

    // Không cho phép cập nhật password qua route này
    // Nên có route riêng: PUT /api/users/me/password

    if (Object.keys(allowedUpdates).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update." });
    }

    try {
      const user = await User.findByPk(userId);
      if (!user) {
        // Trường hợp này hiếm khi xảy ra vì đã qua authenticateToken
        return res.status(404).json({ message: "User not found." });
      }

      // Kiểm tra unique constraints nếu username/email được cập nhật
      if (
        allowedUpdates.username &&
        allowedUpdates.username !== user.username
      ) {
        const existingUsername = await User.findOne({
          where: { username: allowedUpdates.username },
        });
        if (existingUsername) {
          return res.status(409).json({ message: "Username already exists." });
        }
      }
      if (allowedUpdates.email && allowedUpdates.email !== user.email) {
        const existingEmail = await User.findOne({
          where: { email: allowedUpdates.email },
        });
        if (existingEmail) {
          return res.status(409).json({ message: "Email already exists." });
        }
      }

      // Cập nhật các trường được phép
      await user.update(allowedUpdates);

      // Trả về thông tin user đã cập nhật (không bao gồm password)
      const updatedUserData = {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        gender: user.gender,
        dateOfBirth: user.date_of_birth,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      res
        .status(200)
        .json({ message: "User updated successfully", user: updatedUserData });
    } catch (error) {
      console.error("Update Me (User) Error:", error);
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: "Validation Error", errors: messages });
      }
      res
        .status(500)
        .json({ message: "Error updating user data", error: error.message });
    }
  },
};

export default userController;
