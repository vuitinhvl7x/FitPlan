// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan"; // Optional: for request logging
import { sequelize } from "./models/index.js"; // Import sequelize instance from models/index.js

// Import Routers
import userRouter from "./routers/userRouter.js";
// Import other routers as you create them
// import planRouter from './routers/planRouter.js';
// import workoutRouter from './routers/workoutRouter.js';
// import exerciseRouter from './routers/exerciseRouter.js';

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests (optional, useful for form data)
if (process.env.NODE_ENV === "development") {
  // Only use morgan in development
  app.use(morgan("dev")); // HTTP request logger middleware
}

// --- API Routes ---
app.get("/api", (req, res) => {
  // Basic API root check
  res.json({ message: "Welcome to the FitPlan API!" });
});

// Mount Routers with '/api' prefix
app.use("/api/users", userRouter);
// Mount other routers here
// app.use('/api/plans', planRouter);
// app.use('/api/workouts', workoutRouter); // Example for workout sessions and results
// app.use('/api/exercises', exerciseRouter); // Example for fetching/managing exercises

// --- Not Found Handler ---
// Catch 404 for routes not defined above
app.use((req, res, next) => {
  res.status(404).json({ message: "Resource not found on this server." });
});

// --- Global Error Handling Middleware ---
// Must be defined last, after all other app.use() and routes calls
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err); // Log the full error stack

  // Default error response
  const statusCode = err.statusCode || 500; // Use error's status code or default to 500
  const message = err.message || "Internal Server Error";

  // Send JSON error response
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    // Optionally include stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// --- Start Server and Connect DB ---
async function startServer() {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Sync models (Use with caution, especially in production)
    // await sequelize.sync(); // Creates tables if they don't exist (no alter/force)
    await sequelize.sync({ alter: true }); // Checks state and performs necessary changes (dev only)
    // await sequelize.sync({ force: true }); // Drops all tables and recreates (dev only, data loss!)
    console.log("Sequelize models synced (if sync was enabled).");

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("Unable to start server or connect to the database:", error);
    process.exit(1); // Exit process with failure code
  }
}

startServer();
