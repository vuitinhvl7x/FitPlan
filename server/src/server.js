// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./providers/db.js";

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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
