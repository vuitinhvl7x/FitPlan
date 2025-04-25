// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; // <-- Import cookie-parser
// ... các import khác
import { sequelize /* ...các models */ } from "./models/index.js";
import authRouter from "./routers/authRouter.js";
import userRouter from "./routers/userRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors()); // Cân nhắc cấu hình CORS chặt chẽ hơn cho production
app.use(express.json());
app.use(cookieParser()); // <-- Sử dụng cookie-parser middleware ở đây

// Routes
app.get("/", (req, res) => {
  res.json("This is home page - FitPlan API");
});

// Sử dụng Auth Router
app.use("/api/auth", authRouter);

// Sử dụng các router khác
app.use("/api/users", userRouter);
// app.use('/api/plans', planRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Khởi động server và đồng bộ hóa cơ sở dữ liệu
async function startServer() {
  try {
    // await sequelize.sync({ alter: true }); // Dùng alter:true cẩn thận hơn sync() khi dev
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
