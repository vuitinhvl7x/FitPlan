// src/models/WorkoutSession.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";
import TrainingPlan from "./TrainingPlan.js";

const WorkoutSession = sequelize.define(
  "WorkoutSession",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    training_plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: TrainingPlan,
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
    status: {
      type: DataTypes.ENUM("Scheduled", "Completed", "Skipped"),
      defaultValue: "Scheduled",
    },
    intensity_level: {
      type: DataTypes.ENUM("Low", "Medium", "High"),
      allowNull: false,
      defaultValue: "Medium",
    },
    session_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "workout_sessions",
    timestamps: true,
    underscored: true,
  }
);

export default WorkoutSession;
