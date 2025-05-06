// src/models/index.js
import sequelize from "../providers/db.js";
import { DataTypes } from "sequelize";

// Import all models
import User from "./User.js";
import UserProfile from "./UserProfile.js";
import TrainingPlan from "./TrainingPlan.js";
import WorkoutSession from "./WorkoutSession.js";
import Exercise from "./Exercise.js";
import WorkoutExercise from "./WorkoutExercise.js";
import ExerciseResult from "./ExerciseResult.js";
import UserDailyCondition from "./UserDailyCondition.js";
import UserMeasurement from "./UserMeasurement.js";

// --- Define Associations ---

// User <-> UserProfile (One-to-One)
User.hasOne(UserProfile, {
  foreignKey: "user_id",
  as: "profile",
  onDelete: "CASCADE",
});
UserProfile.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User <-> TrainingPlan (One-to-Many)
User.hasMany(TrainingPlan, {
  foreignKey: "user_id",
  as: "trainingPlans",
  onDelete: "CASCADE",
});
TrainingPlan.belongsTo(User, { foreignKey: "user_id", as: "user" });

// TrainingPlan <-> WorkoutSession (One-to-Many)
TrainingPlan.hasMany(WorkoutSession, {
  foreignKey: "training_plan_id",
  as: "sessions",
  onDelete: "CASCADE",
});
WorkoutSession.belongsTo(TrainingPlan, {
  foreignKey: "training_plan_id",
  as: "trainingPlan",
});

// WorkoutSession <-> Exercise (Many-to-Many through WorkoutExercise)
WorkoutSession.belongsToMany(Exercise, {
  through: WorkoutExercise,
  foreignKey: "workout_session_id",
  otherKey: "exercise_id",
  as: "exercises",
});
Exercise.belongsToMany(WorkoutSession, {
  through: WorkoutExercise,
  foreignKey: "exercise_id",
  otherKey: "workout_session_id",
  as: "workoutSessions",
});

// Explicit associations FOR the join table WorkoutExercise
WorkoutSession.hasMany(WorkoutExercise, {
  foreignKey: "workout_session_id",
  as: "workoutExercises",
  onDelete: "CASCADE",
});
WorkoutExercise.belongsTo(WorkoutSession, {
  foreignKey: "workout_session_id",
  as: "workoutSession",
});

Exercise.hasMany(WorkoutExercise, {
  foreignKey: "exercise_id",
  as: "workoutInstances",
  onDelete: "CASCADE",
});
WorkoutExercise.belongsTo(Exercise, {
  foreignKey: "exercise_id",
  as: "exercise",
});

// WorkoutExercise <-> ExerciseResult (One-to-Many)
WorkoutExercise.hasMany(ExerciseResult, {
  foreignKey: "workout_exercise_id",
  as: "results",
  onDelete: "CASCADE",
});
ExerciseResult.belongsTo(WorkoutExercise, {
  foreignKey: "workout_exercise_id",
  as: "workoutExercise",
});

// User <-> ExerciseResult (One-to-Many - Denormalized)
User.hasMany(ExerciseResult, {
  foreignKey: "user_id",
  as: "exerciseResults",
  onDelete: "CASCADE",
});
ExerciseResult.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User <-> UserDailyCondition (One-to-Many)
User.hasMany(UserDailyCondition, {
  foreignKey: "user_id",
  as: "dailyConditions",
  onDelete: "CASCADE",
});
UserDailyCondition.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User <-> UserMeasurement (One-to-Many)
User.hasMany(UserMeasurement, {
  foreignKey: "user_id",
  as: "measurements",
  onDelete: "CASCADE",
});
UserMeasurement.belongsTo(User, { foreignKey: "user_id", as: "user" });

// --- Export Models and Sequelize Instance ---
export {
  sequelize,
  DataTypes,
  User,
  UserProfile,
  TrainingPlan,
  WorkoutSession,
  Exercise,
  WorkoutExercise,
  ExerciseResult,
  UserDailyCondition,
  UserMeasurement, // --- NEW EXPORT ---
};
