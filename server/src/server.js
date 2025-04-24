// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// ... các import khác
import { sequelize /* ...các models */ } from "./models/index.js"; // <-- Sửa đường dẫn
import authRouter from "./routers/authRouter.js"; // <-- Sửa đường dẫn
// Import các router khác nếu có (ví dụ: userRouter)
import userRouter from "./routers/userRouter.js"; // <-- Sửa đường dẫn

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json()); // Để parse JSON request body
// Có thể thêm morgan cho logging: import morgan from 'morgan'; app.use(morgan('dev'));

// Routes
app.get("/", (req, res) => {
  res.json("This is home page - FitPlan API");
});

// Sử dụng Auth Router (thêm tiền tố /api/auth)
app.use("/api/auth", authRouter);

// Sử dụng các router khác (ví dụ)
app.use("/api/users", userRouter); // Sử dụng userRouter
// app.use('/api/plans', planRouter); // Sẽ tạo sau

// Error handling middleware (nên đặt cuối cùng)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Khởi động server và đồng bộ hóa cơ sở dữ liệu
async function startServer() {
  try {
    await sequelize.sync(); // Dùng khi dev để cập nhật schema
    await sequelize.authenticate(); // Chỉ kiểm tra kết nối khi đã ổn định schema
    console.log("Database connection established.");

    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
  }
}

startServer();
