// src/models/WorkoutExercise.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";
import WorkoutSession from "./WorkoutSession.js";
import Exercise from "./Exercise.js";

const WorkoutExercise = sequelize.define(
  "WorkoutExercise",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    workout_session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: WorkoutSession,
        key: "id",
      },
    },
    exercise_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Exercise,
        key: "id",
      },
    },
    sets_planned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    reps_planned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    weight_planned: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    rest_time: {
      type: DataTypes.INTEGER,
      defaultValue: 60,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    is_customized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "workout_exercises",
    timestamps: true,
    underscored: true,
  }
);

export default WorkoutExercise;
