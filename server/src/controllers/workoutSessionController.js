// src/controllers/workoutSessionController.js
import {
  workoutSessionService,
  NotFoundError,
  ForbiddenError,
} from "../services/workoutSessionService.js";

const workoutSessionController = {
  /**
   * GET /api/workout-sessions/:sessionId
   * Gets details of a specific workout session.
   */
  getSessionById: async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id; // From authenticateToken middleware

    try {
      const session = await workoutSessionService.getSessionById(
        sessionId,
        userId
      );
      res.status(200).json(session);
    } catch (error) {
      console.error("Get Session By ID Error:", error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({
        message: "Error fetching workout session details",
        error: error.message,
      });
    }
  },

  /**
   * POST /api/workout-sessions/:sessionId/exercises
   * Adds a new exercise to a specific workout session.
   */
  addExerciseToSession: async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const exerciseData = req.body; // { exerciseId, sets_planned, reps_planned, order?, ... }

    try {
      const newWorkoutExercise =
        await workoutSessionService.addExerciseToSession(
          sessionId,
          userId,
          exerciseData
        );
      res.status(201).json({
        message: "Exercise added to session successfully!",
        workoutExercise: newWorkoutExercise,
      });
    } catch (error) {
      console.error("Add Exercise to Session Error:", error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({ message: error.message });
      }
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: "Validation Error", errors: messages });
      }
      res.status(500).json({
        message: "Error adding exercise to session",
        error: error.message,
      });
    }
  },

  // TODO: Add other methods like updateSessionNotes, updateSessionStatus if needed
};

export default workoutSessionController;
