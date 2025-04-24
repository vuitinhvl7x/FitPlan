// src/models/ExerciseResult.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";

const ExerciseResult = sequelize.define(
  "ExerciseResult",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    workout_exercise_id: {
      // Link to the specific planned exercise instance
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "workout_exercises", // Reference table name
        key: "id",
      },
      onDelete: "CASCADE",
    },
    user_id: {
      // Denormalized for easier querying of user's results
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users", // Reference table name
        key: "id",
      },
      onDelete: "CASCADE",
    },
    set_number: {
      // Which set this result belongs to
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    reps_completed: {
      type: DataTypes.INTEGER,
      allowNull: true, // Might be null if only duration is tracked
      validate: { min: 0 },
    },
    weight_used: {
      // in kg or lbs
      type: DataTypes.FLOAT,
      allowNull: true, // Might be null for bodyweight or cardio
      validate: { min: 0 },
    },
    duration_completed: {
      // in seconds or minutes
      type: DataTypes.INTEGER,
      allowNull: true, // Might be null if only reps are tracked
      validate: { min: 0 },
    },
    rating: {
      // Optional: User's perceived difficulty (e.g., 1-5 or RPE)
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 10 }, // Example RPE scale 1-10
    },
    notes: {
      // User notes specific to this set/result
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completed_at: {
      // Timestamp when the set was completed
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    // Removed reps_performed (use reps_completed), weight_used (already present), duration (use duration_completed)
  },
  {
    tableName: "exercise_results",
    timestamps: true, // createdAt will track when the result was logged
    underscored: true, // Use snake_case
    indexes: [
      // Add indexes
      { fields: ["workout_exercise_id"] },
      { fields: ["user_id"] },
      { fields: ["completed_at"] },
    ],
  }
);

export default ExerciseResult;
