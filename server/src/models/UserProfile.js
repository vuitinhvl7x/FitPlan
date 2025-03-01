// src/models/UserProfile.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";
import User from "./User.js";

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
        model: User,
        key: "id",
      },
    },
    activity_level: {
      type: DataTypes.ENUM(
        "Sedentary",
        "Lightly Active",
        "Moderately Active",
        "Very Active",
        "Extremely Active"
      ),
      allowNull: false,
    },
    goals: {
      type: DataTypes.ENUM(
        "Weight Loss",
        "Muscle Gain",
        "Endurance",
        "Overall Health"
      ),
      allowNull: false,
    },
    experience: {
      type: DataTypes.ENUM("Beginner", "Intermediate", "Advanced"),
      allowNull: false,
    },
    training_location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    preferred_training_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 7,
      },
    },
    wants_pre_workout_info: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
  },
  {
    tableName: "user_profiles",
    timestamps: true,
    underscored: true,
  }
);

export default UserProfile;
