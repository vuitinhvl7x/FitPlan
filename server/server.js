// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./src/providers/db.js";
import {
  sequelize,
  User,
  UserProfile,
  TrainingPlan,
  WorkoutSession,
  Exercise,
  WorkoutExercise,
  ExerciseResult,
  UserDailyCondition,
} from "./src/models/index.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json("This is home page");
});

// Error handling

// Khởi động server và đồng bộ hóa cơ sở dữ liệu
async function startServer() {
  try {
    // Đồng bộ hóa các model với cơ sở dữ liệu
    await sequelize.sync({ alter: true }); // Sử dụng alter: true để cập nhật schema nếu có thay đổi
    console.log("Database synced.");

    // Khởi động server
    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to sync the database:", error);
  }
}

startServer();
