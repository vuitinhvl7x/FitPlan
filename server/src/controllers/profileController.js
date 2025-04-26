// src/controllers/profileController.js
import { UserProfile } from "../models/index.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from "../utils/cloudinaryUploader.js";

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
  updateProfilePicture: async (req, res) => {
    const userId = req.user.id;

    // 1. Kiểm tra xem có file được upload không (multer đã xử lý và gắn vào req.file)
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded." });
    }

    try {
      // 2. Tìm profile của user
      const profile = await UserProfile.findOne({ where: { user_id: userId } });
      if (!profile) {
        // Mặc dù hiếm khi xảy ra sau authenticateToken, vẫn nên kiểm tra
        return res.status(404).json({ message: "User profile not found." });
      }

      // 3. (Optional but Recommended) Xóa ảnh cũ trên Cloudinary nếu có
      const oldImageUrl = profile.profile_pic_url;
      if (oldImageUrl) {
        const publicId = getPublicIdFromUrl(oldImageUrl);
        if (publicId) {
          try {
            console.log(
              `Attempting to delete old image with public_id: ${publicId}`
            );
            await deleteFromCloudinary(publicId);
            console.log(
              `Successfully deleted (or skipped deletion of) old image: ${publicId}`
            );
          } catch (deleteError) {
            // Lỗi đã được log trong hàm deleteFromCloudinary, tiếp tục xử lý
            console.warn(
              `Could not delete old image ${publicId}. Proceeding with upload.`
            );
          }
        } else {
          console.warn(
            `Could not extract public_id from old URL: ${oldImageUrl}`
          );
        }
      }

      // 4. Upload ảnh mới lên Cloudinary
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "profile_pics"
      ); // Lưu vào folder 'profile_pics'

      // 5. Cập nhật URL ảnh mới vào profile trong DB
      await profile.update({ profile_pic_url: uploadResult.secure_url });

      // 6. Trả về thông tin profile đã cập nhật (hoặc chỉ URL mới)
      res.status(200).json({
        message: "Profile picture updated successfully.",
        profilePicUrl: uploadResult.secure_url,
        // profile: profile // Có thể trả về cả profile nếu muốn
      });
    } catch (error) {
      console.error("Update Profile Picture Error:", error);
      // Phân loại lỗi nếu cần (ví dụ: lỗi Cloudinary, lỗi DB)
      if (error.message.includes("Cloudinary")) {
        return res
          .status(500)
          .json({ message: "Error uploading image.", error: error.message });
      }
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res.status(400).json({
          message: "Validation Error updating profile",
          errors: messages,
        });
      }
      res.status(500).json({
        message: "Error updating profile picture.",
        error: error.message,
      });
    }
  },
};

export default profileController;
