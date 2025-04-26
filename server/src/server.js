// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
// ... các import khác
import { sequelize } from "./models/index.js";
import authRouter from "./routers/authRouter.js";
import userRouter from "./routers/userRouter.js";
import profileRouter from "./routers/profileRouter.js"; // <-- Import profileRouter

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.json("This is home page - FitPlan API");
});

// Sử dụng các Routers
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/profiles", profileRouter); // <-- Sử dụng profileRouter

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Khởi động server và đồng bộ hóa cơ sở dữ liệu
async function startServer() {
  try {
    sequelize.sync();
    await sequelize.authenticate();
    console.log("Database connection established.");

    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
  }
}

startServer();
