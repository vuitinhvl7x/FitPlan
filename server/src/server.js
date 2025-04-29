// server/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

import { sequelize } from "./models/index.js";
import authRouter from "./routers/authRouter.js";
import userRouter from "./routers/userRouter.js";
import profileRouter from "./routers/profileRouter.js";
import exerciseRouter from "./routers/exerciseRouter.js";
import planRouter from "./routers/planRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors()); // Configure CORS as needed for your frontend origin
app.use(helmet()); // Add security headers
app.use(morgan("dev")); // Logging HTTP requests
app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies

// Routes
app.get("/", (req, res) => {
  res.json("This is home page - FitPlan API");
});

// Use the Routers
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/profiles", profileRouter);
app.use("/api/exercises", exerciseRouter);
app.use("/api/plans", planRouter);

// Error handling middleware (should be the last middleware)
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).send("Something broke!");
});

// Start server and synchronize database
async function startServer() {
  try {
    // Ensure database connection is authenticated first
    sequelize.sync();
    await sequelize.authenticate();
    console.log("Database connection established.");

    // Sync models (create tables if they don't exist, doesn't handle complex migrations)
    // For production, use Sequelize migrations instead of sync({ alter: true }) or sync()
    // await sequelize.sync({ alter: true }); // Use alter: true cautiously in production
    // console.log("Database synchronized.");

    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1); // Exit process if unable to connect to DB or start server
  }
}

startServer();
