// src/models/UserProfile.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";
import User from "./User.js"; // Ensure User model is imported if not already

const UserProfile = sequelize.define(
  "UserProfile",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User, // Reference the User model directly
        key: "id",
      },
      unique: true, // A user should only have one profile
      onDelete: "CASCADE", // Optional: Delete profile if user is deleted
    },
    activity_level: {
      type: DataTypes.ENUM(
        "Sedentary", // Ít vận động
        "Lightly Active", // Vận động nhẹ
        "Moderately Active", // Vận động vừa phải
        "Very Active", // Rất năng động
        "Extremely Active" // Cực kỳ năng động
      ),
      allowNull: false,
    },
    goals: {
      type: DataTypes.ENUM(
        "Weight Loss", // Giảm cân
        "Muscle Gain", // Tăng cơ
        "Endurance", // Tăng sức bền
        "Overall Health" // Sức khỏe tổng thể
      ),
      allowNull: false,
    },
    experience: {
      type: DataTypes.ENUM(
        "Beginner", // Mới bắt đầu
        "Intermediate", // Trung cấp
        "Advanced" // Nâng cao
      ),
      allowNull: false,
    },
    training_location: {
      // e.g., "Home", "Gym", "Outdoor"
      type: DataTypes.STRING,
      allowNull: false,
    },
    preferred_training_days: {
      // Stores an array of preferred days, e.g., ["Monday", "Wednesday", "Friday"]
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true, // Allow null if user doesn't specify preferences yet
      defaultValue: [], // Default to an empty array
    },
    wants_pre_workout_info: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    weight: {
      // in kilograms
      type: DataTypes.FLOAT,
      allowNull: true, // Allow null initially
      validate: {
        min: 0,
      },
    },
    height: {
      // in centimeters
      type: DataTypes.FLOAT,
      allowNull: true, // Allow null initially
      validate: {
        min: 0,
      },
    },
    // birth_date field removed - use dateOfBirth from User model instead
  },
  {
    tableName: "user_profiles",
    timestamps: true, // Automatically add createdAt and updatedAt
    underscored: true, // Use snake_case for column names in DB (e.g., user_id)
  }
);

export default UserProfile;
