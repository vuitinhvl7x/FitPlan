// src/models/ExerciseResult.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";
import WorkoutExercise from "./WorkoutExercise.js";

const ExerciseResult = sequelize.define(
  "ExerciseResult",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    workout_exercise_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: WorkoutExercise,
        key: "id",
      },
    },
    set_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    reps_performed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    weight_used: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    duration: {
      type: DataTypes.INTEGER,
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "exercise_results",
    timestamps: true,
    underscored: true,
  }
);

export default ExerciseResult;
