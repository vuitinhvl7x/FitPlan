// src/controllers/profileController.js
import { UserProfile } from "../models/index.js";

const profileController = {
  // GET /api/profiles/me - Lấy profile của user hiện tại
  getProfileMe: async (req, res) => {
    const userId = req.user.id; // Lấy từ user đã được xác thực

    try {
      const profile = await UserProfile.findOne({ where: { user_id: userId } });

      if (!profile) {
        // Profile có thể chưa được tạo nếu có lỗi trong quá trình đăng ký
        // Hoặc bạn có thể muốn tạo profile mặc định ở đây nếu chưa có
        return res.status(404).json({ message: "User profile not found." });
      }

      res.status(200).json(profile);
    } catch (error) {
      console.error("Get Profile Me Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching user profile", error: error.message });
    }
  },

  // PUT /api/profiles/me - Cập nhật profile của user hiện tại
  updateProfileMe: async (req, res) => {
    const userId = req.user.id;
    const {
      activity_level,
      goals,
      experience,
      training_location,
      preferred_training_days,
      wants_pre_workout_info,
      weight,
      height,
    } = req.body;

    // Tạo object chứa các trường được phép cập nhật
    const allowedUpdates = {};
    if (activity_level !== undefined)
      allowedUpdates.activity_level = activity_level;
    if (goals !== undefined) allowedUpdates.goals = goals;
    if (experience !== undefined) allowedUpdates.experience = experience;
    if (training_location !== undefined)
      allowedUpdates.training_location = training_location;
    if (preferred_training_days !== undefined)
      allowedUpdates.preferred_training_days = preferred_training_days;
    if (wants_pre_workout_info !== undefined)
      allowedUpdates.wants_pre_workout_info = wants_pre_workout_info;
    if (weight !== undefined) allowedUpdates.weight = weight;
    if (height !== undefined) allowedUpdates.height = height;

    if (Object.keys(allowedUpdates).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update." });
    }

    try {
      const profile = await UserProfile.findOne({ where: { user_id: userId } });

      if (!profile) {
        return res
          .status(404)
          .json({ message: "User profile not found. Cannot update." });
      }

      // Cập nhật profile
      await profile.update(allowedUpdates);

      res
        .status(200)
        .json({ message: "Profile updated successfully", profile: profile });
    } catch (error) {
      console.error("Update Profile Me Error:", error);
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: "Validation Error", errors: messages });
      }
      res
        .status(500)
        .json({ message: "Error updating user profile", error: error.message });
    }
  },
};

export default profileController;
