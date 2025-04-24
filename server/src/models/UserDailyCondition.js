// src/models/UserDailyCondition.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";
import User from "./User.js";

const UserDailyCondition = sequelize.define(
  "UserDailyCondition",
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
        model: User,
        key: "id",
      },
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    health_status: {
      type: DataTypes.ENUM("Good", "Average", "Poor"),
      allowNull: false,
    },
    available_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    energy_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10,
      },
    },
    sleep_quality: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10,
      },
    },
    stress_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10,
      },
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "user_daily_conditions",
    timestamps: true,
    underscored: true,
  }
);

export default UserDailyCondition;
