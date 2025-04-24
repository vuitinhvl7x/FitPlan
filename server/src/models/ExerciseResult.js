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
        model: "workout_exercises",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    user_id: {
      // Denormalized for easier querying of user's results
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    set_number: {
      // Which set this result belongs to
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reps_completed: {
      type: DataTypes.INTEGER,
      allowNull: true, // Might be null if only duration is tracked
    },
    weight_used: {
      // in kg or lbs
      type: DataTypes.FLOAT,
      allowNull: true, // Might be null for bodyweight or cardio
    },
    duration_completed: {
      // in seconds or minutes
      type: DataTypes.INTEGER,
      allowNull: true, // Might be null if only reps are tracked
    },
    rating: {
      // Optional: User's perceived difficulty (e.g., 1-5 or RPE)
      type: DataTypes.INTEGER,
      allowNull: true,
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
