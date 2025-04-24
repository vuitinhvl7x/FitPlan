// src/models/Exercise.js
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
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: true, // Allow custom exercises without an api_id
      comment: "ID from the external exercise API, if applicable",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      // Added field
      type: DataTypes.ENUM(
        "Strength",
        "Cardio",
        "Stretching",
        "Plyometrics",
        "Olympic Weightlifting",
        "Strongman",
        "Other"
      ),
      allowNull: true, // Or set a defaultValue like 'Other' if preferred
      comment: "Categorizes the type of exercise",
    },
    is_custom: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "True if this exercise was added by a user, not from API",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    muscle_group: {
      // Consider making this ENUM or linking to a separate MuscleGroup table if needed
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Primary muscle group targeted",
    },
    equipment: {
      // Consider making this ENUM or linking to an Equipment table
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Equipment required for the exercise",
    },
    media_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true, // Optional: validate if it's a URL
      },
      comment: "URL to an image or video demonstrating the exercise",
    },
  },
  {
    tableName: "exercises",
    timestamps: true,
    underscored: true,
  }
);

export default Exercise;
