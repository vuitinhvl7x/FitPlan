// src/models/WorkoutExercise.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";

const WorkoutExercise = sequelize.define(
  "WorkoutExercise",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    workout_session_id: {
      // Foreign key
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "workout_sessions", // Reference table name
        key: "id",
      },
      onDelete: "CASCADE",
    },
    exercise_id: {
      // Foreign key
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "exercises", // Reference table name
        key: "id",
      },
      onDelete: "CASCADE", // Or 'SET NULL' if you want to keep the record but remove the exercise link
    },
    order: {
      // Order of the exercise within the workout session
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sets_planned: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null if not applicable (e.g., cardio duration)
      validate: { min: 0 },
    },
    reps_planned: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null if not applicable (e.g., timed sets)
      validate: { min: 0 },
    },
    weight_planned: {
      // in kg or lbs (ensure consistency in your app logic)
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: { min: 0 },
    },
    duration_planned: {
      // in seconds or minutes (for timed exercises like cardio/plank)
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0 },
    },
    rest_period: {
      // Rest period after this exercise in seconds
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0 },
    },
    notes: {
      // Specific notes for this exercise in this workout
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Removed is_customized, rest_time from previous version
  },
  {
    tableName: "workout_exercises",
    timestamps: true, // Track when this specific exercise was added/updated in the plan
    underscored: true, // Use snake_case
    indexes: [
      // Add indexes for faster lookups
      { fields: ["workout_session_id"] },
      { fields: ["exercise_id"] },
    ],
  }
);

export default WorkoutExercise;
