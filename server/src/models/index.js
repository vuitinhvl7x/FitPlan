// src/models/index.js
import sequelize from "../providers/db.js";
import User from "./User.js";
import UserProfile from "./UserProfile.js";
import TrainingPlan from "./TrainingPlan.js";
import WorkoutSession from "./WorkoutSession.js";
import Exercise from "./Exercise.js";
import WorkoutExercise from "./WorkoutExercise.js";
import ExerciseResult from "./ExerciseResult.js";
import UserDailyCondition from "./UserDailyCondition.js";

// Thiết lập quan hệ
User.hasOne(UserProfile, {
  foreignKey: "user_id",
  as: "profile",
  onDelete: "CASCADE",
});
UserProfile.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(TrainingPlan, {
  foreignKey: "user_id",
  as: "trainingPlans",
  onDelete: "CASCADE",
});
TrainingPlan.belongsTo(User, { foreignKey: "user_id", as: "user" });

TrainingPlan.hasMany(WorkoutSession, {
  foreignKey: "training_plan_id",
  as: "workoutSessions",
  onDelete: "CASCADE",
});
WorkoutSession.belongsTo(TrainingPlan, {
  foreignKey: "training_plan_id",
  as: "trainingPlan",
});

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
  as: "workoutExercises",
});
WorkoutExercise.belongsTo(Exercise, {
  foreignKey: "exercise_id",
  as: "exercise",
});

WorkoutExercise.hasMany(ExerciseResult, {
  foreignKey: "workout_exercise_id",
  as: "exerciseResults",
  onDelete: "CASCADE",
});
ExerciseResult.belongsTo(WorkoutExercise, {
  foreignKey: "workout_exercise_id",
  as: "workoutExercise",
});

User.hasMany(UserDailyCondition, {
  foreignKey: "user_id",
  as: "dailyConditions",
  onDelete: "CASCADE",
});
UserDailyCondition.belongsTo(User, { foreignKey: "user_id", as: "user" });

export {
  sequelize,
  User,
  UserProfile,
  TrainingPlan,
  WorkoutSession,
  Exercise,
  WorkoutExercise,
  ExerciseResult,
  UserDailyCondition,
};
