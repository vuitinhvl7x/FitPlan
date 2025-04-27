// server/src/controllers/planController.js
import planGeneratorService from "../services/planGeneratorService.js";

const planController = {
  /**
   * Handles the request to generate a training plan for the authenticated user.
   * POST /api/plans/generate
   */
  generateTrainingPlan: async (req, res) => {
    // authenticateToken middleware ensures req.user is available
    const userId = req.user.id;

    try {
      console.log(`Received request to generate plan for user ID: ${userId}`);
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
      // Provide a more user-friendly error message
      let statusCode = 500;
      let message = "Error generating training plan.";

      if (error.message.includes("User or User Profile not found")) {
        statusCode = 404;
        message =
          "User profile not found. Please complete your profile before generating a plan.";
      } else if (error.message.includes("No exercises found")) {
        statusCode = 400; // Bad request, user's location has no matching exercises
        message = error.message; // Use the specific error message from service
      } else if (error.message.includes("Gemini API")) {
        statusCode = 500; // Internal server error related to API
        message = `Failed to generate plan using AI: ${error.message}`;
      } else if (error.message.includes("invalid or empty plan structure")) {
        statusCode = 500; // Internal server error, AI returned bad data
        message = `AI returned an invalid plan structure: ${error.message}`;
      }
      // Add more specific error handling based on potential service errors

      res.status(statusCode).json({ message, error: error.message });
    }
  },

  // TODO: Add controllers for other plan routes (e.g., getPlan, getUserPlans, updatePlan, deletePlan)
};

export default planController;
