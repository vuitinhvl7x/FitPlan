// src/models/WorkoutSession.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";
// No need to import TrainingPlan here for definition, only for association in index.js

const WorkoutSession = sequelize.define(
  "WorkoutSession",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    training_plan_id: {
      // Foreign key
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "training_plans", // Reference table name
        key: "id",
      },
      onDelete: "CASCADE", // Delete sessions if plan is deleted
    },
    name: {
      type: DataTypes.STRING, // e.g., "Day 1: Upper Body", "Week 3: Leg Day"
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY, // Specific date for this session
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Planned", "Completed", "Skipped"),
      allowNull: false,
      defaultValue: "Planned",
    },
    notes: {
      type: DataTypes.TEXT, // User notes for the session
      allowNull: true,
    },
    duration_planned: {
      // Optional: Planned duration in minutes
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duration_actual: {
      // Optional: Actual duration in minutes
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Removed intensity_level and session_duration from previous version
    // as duration_planned/actual seem more flexible. Add back if needed.
  },
  {
    tableName: "workout_sessions",
    timestamps: true,
    underscored: true, // Use snake_case
  }
);

export default WorkoutSession;
