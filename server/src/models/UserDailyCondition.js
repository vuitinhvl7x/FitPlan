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
        model: "users",
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
    },
    sleep_quality: {
      // e.g., 1-5 rating
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    energy_level: {
      // e.g., 1-5 rating
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stress_level: {
      // e.g., 1-5 rating
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    muscle_soreness: {
      // e.g., 1-5 rating or specific areas
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
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
