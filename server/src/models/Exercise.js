// src/models/Exercise.js (Updated - Replacing muscle_group with target_muscle and body_part)
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";

const Exercise = sequelize.define(
  "Exercise",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    api_id: {
      type: DataTypes.STRING, // Giữ nguyên STRING
      unique: true,
      allowNull: true,
      comment: "ID from the external exercise API, if applicable",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_custom: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "True if this exercise was added by a user, not from API",
    },
    instructions: {
      type: DataTypes.TEXT, // Giữ nguyên instructions
      allowNull: true,
      comment: "Step-by-step instructions for the exercise",
    },
    // --- Xóa trường muscle_group ---
    // muscle_group: { ... },

    // --- Thêm trường target_muscle (từ API 'target') ---
    target_muscle: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Primary targeted muscle group (from API 'target')",
    },
    // --- Thêm trường body_part (từ API 'bodyPart') ---
    body_part: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Body part targeted (from API 'bodyPart')",
    },

    equipment: {
      type: DataTypes.STRING, // Giữ nguyên equipment
      allowNull: true,
      comment: "Equipment required for the exercise",
    },
    media_url: {
      type: DataTypes.STRING, // Giữ nguyên media_url
      allowNull: true,
      validate: {
        isUrl: true,
      },
      comment: "URL to an image or video demonstrating the exercise",
    },
    secondary_muscles: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Giữ nguyên secondary_muscles
      allowNull: true,
      comment: "Secondary muscle groups targeted",
    },
  },
  {
    tableName: "exercises",
    timestamps: true,
    underscored: true,
  }
);

export default Exercise;
