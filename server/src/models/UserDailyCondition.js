// src/models/UserDailyCondition.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";

const UserDailyCondition = sequelize.define(
  "UserDailyCondition",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      // Foreign key
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users", // Reference table name
        key: "id",
      },
      onDelete: "CASCADE",
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    sleep_hours: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: { min: 0 },
    },
    sleep_quality: {
      // e.g., 1-5 rating
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }, // Example scale 1-5
    },
    energy_level: {
      // e.g., 1-5 rating
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }, // Example scale 1-5
    },
    stress_level: {
      // e.g., 1-5 rating
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }, // Example scale 1-5
    },
    muscle_soreness: {
      // e.g., 1-5 rating or specific areas
      type: DataTypes.INTEGER, // Could also be JSONB for more detail { area: 'legs', level: 3 }
      allowNull: true,
      validate: { min: 1, max: 5 }, // Example scale 1-5
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Removed health_status, available_time, and specific 1-10 scales from previous version
    // Replaced with more granular fields. Add back if needed.
  },
  {
    tableName: "user_daily_conditions",
    timestamps: true, // Track when the condition was logged
    underscored: true, // Use snake_case
    indexes: [
      // Add indexes
      { fields: ["user_id", "date"], unique: true }, // A user should only have one condition entry per day
    ],
  }
);

export default UserDailyCondition;
