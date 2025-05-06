// src/controllers/planController.js
import planGeneratorService from "../services/planGeneratorService.js";
// Import the new service and error types
import {
  planService,
  NotFoundError,
  ForbiddenError,
} from "../services/planService.js";

const planController = {
  /**
   * Handles the request to generate a training plan for the authenticated user.
   * POST /api/plans/generate
   */
  generateTrainingPlan: async (req, res) => {
    const userId = req.user.id;

    try {
      console.log(`Received request to generate plan for user ID: ${userId}`);

      // --- MODIFIED LOGIC: Check for ANY active plan ---
      const existingActivePlan = await planService
        .getUserPlans(userId) // Get all user plans
        .then((plans) => plans.find((p) => p.status === "Active")); // Find if any is Active

      if (existingActivePlan) {
        // If an Active plan exists, block generation
        return res.status(400).json({
          message:
            "You already have an active training plan. Please complete or archive it before generating a new one.",
          activePlanId: existingActivePlan.id, // Optional: return active plan ID
        });
      }
      // --- END MODIFIED LOGIC ---

      // If no active plan is found, proceed to generate
      const createdPlan = await planGeneratorService.generatePlan(userId);

      res.status(201).json({
        message: "Training plan generated successfully!",
        planId: createdPlan.id,
        planName: createdPlan.name,
        startDate: createdPlan.start_date,
        endDate: createdPlan.end_date,
      });
    } catch (error) {
      console.error("Error in planController.generateTrainingPlan:", error);
      let statusCode = error.status || 500;
      let message = error.message || "Error generating training plan.";

      // Keep existing specific error handling
      if (error.message.includes("User or User Profile not found")) {
        statusCode = 404;
        message =
          "User profile not found. Please complete your profile before generating a plan.";
      } else if (error.message.includes("No exercises found")) {
        statusCode = 400;
        message = error.message;
      } else if (error.message.includes("Gemini API")) {
        statusCode = 500;
        message = `Failed to generate plan using AI: ${error.message}`;
      } else if (error.message.includes("invalid or empty plan structure")) {
        statusCode = 500;
        message = `AI returned an invalid plan structure: ${error.message}`;
      }
      // The "already have an active plan" error is now handled explicitly above

      res.status(statusCode).json({ message, error: error.message });
    }
  },

  // --- NEW METHODS ---

  /**
   * PUT /api/plans/:planId
   * Updates the status of a training plan.
   */
  updatePlanStatus: async (req, res) => {
    const { planId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    try {
      const updatedPlan = await planService.updatePlanStatus(
        planId,
        userId,
        status
      );
      res.status(200).json({
        message: "Plan status updated successfully!",
        plan: updatedPlan, // Return updated plan
      });
    } catch (error) {
      console.error("Update Plan Status Error:", error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({ message: error.message });
      }
      if (error.name === "SequelizeValidationError") {
        // Catch validation errors from service/model
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: "Validation Error", errors: messages });
      }
      res
        .status(500)
        .json({ message: "Error updating plan status", error: error.message });
    }
  },

  /**
   * GET /api/plans/:planId
   * Gets details of a specific training plan.
   */
  getPlanById: async (req, res) => {
    const { planId } = req.params;
    const userId = req.user.id;

    try {
      const plan = await planService.getPlanById(planId, userId);
      res.status(200).json(plan);
    } catch (error) {
      console.error("Get Plan By ID Error:", error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({
        message: "Error fetching training plan details",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/plans/me
   * Gets all training plans for the current user.
   */
  getUserPlans: async (req, res) => {
    const userId = req.user.id;

    try {
      const plans = await planService.getUserPlans(userId);
      res.status(200).json(plans);
    } catch (error) {
      console.error("Get User Plans Error:", error);
      // Don't expose detailed errors for list retrieval usually
      res.status(500).json({ message: "Error fetching user training plans" });
    }
  },
};

export default planController;
