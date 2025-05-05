// src/tasks/weeklyPlanUpdateTask.js
import cron from "node-cron"; // npm install node-cron
// --- Import the renamed function ---
import weeklyUpdateService from "../services/weeklyUpdateService.js";
import { sequelize } from "../models/index.js"; // Import sequelize to ensure DB connection is ready

// Ensure DB connection is established before scheduling
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established for cron task.");

    // Schedule the task to run, e.g., every Sunday at 11:00 PM (23:00)
    // This task will now primarily handle OVERDUE plans.
    cron.schedule("0 23 * * 0", async () => {
      console.log("Running scheduled overdue plan handler task...");
      try {
        // --- Call the renamed function ---
        await weeklyUpdateService.runScheduledOverduePlanHandler();
        console.log("Scheduled overdue plan handler task completed.");
      } catch (error) {
        console.error("Scheduled overdue plan handler task failed:", error);
      }
    });

    console.log("Scheduled overdue plan handler task scheduled.");
  })
  .catch((err) => {
    console.error("Failed to connect to database for cron task:", err);
    // Handle error, maybe exit the process or retry
  });

// Note: This script needs to be kept running for the cron job to execute.
// In a production environment, you might run this as a separate process
// or integrate it into your main application startup if appropriate.
