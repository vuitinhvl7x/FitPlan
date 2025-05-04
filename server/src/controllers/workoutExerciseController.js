// src/controllers/workoutExerciseController.js
import {
  workoutExerciseService,
  NotFoundError,
  ForbiddenError,
} from "../services/workoutExerciseService.js";

const workoutExerciseController = {
  /**
   * PUT /api/workout-exercises/:workoutExerciseId
   * Updates details (sets, reps, weight, etc.) of a specific exercise within a workout.
   */
  updateWorkoutExercise: async (req, res) => {
    const { workoutExerciseId } = req.params;
    const userId = req.user.id;
    const updateData = req.body; // { sets_planned?, reps_planned?, ... }

    try {
      const updatedWorkoutExercise =
        await workoutExerciseService.updateWorkoutExercise(
          workoutExerciseId,
          userId,
          updateData
        );
      res.status(200).json({
        message: "Workout exercise updated successfully!",
        workoutExercise: updatedWorkoutExercise,
      });
    } catch (error) {
      console.error("Update Workout Exercise Error:", error);
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
        message: "Error updating workout exercise",
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/workout-exercises/:workoutExerciseId/swap
   * Swaps the base exercise for a WorkoutExercise instance.
   */
  swapExercise: async (req, res) => {
    const { workoutExerciseId } = req.params;
    const userId = req.user.id;
    const { newExerciseId } = req.body; // Expecting { "newExerciseId": "uuid" }

    if (!newExerciseId) {
      return res
        .status(400)
        .json({ message: "Missing 'newExerciseId' in request body." });
    }

    try {
      const updatedWorkoutExercise = await workoutExerciseService.swapExercise(
        workoutExerciseId,
        userId,
        newExerciseId
      );
      res.status(200).json({
        message: "Exercise swapped successfully!",
        workoutExercise: updatedWorkoutExercise,
      });
    } catch (error) {
      console.error("Swap Exercise Error:", error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({ message: error.message });
      }
      res
        .status(500)
        .json({ message: "Error swapping exercise", error: error.message });
    }
  },

  /**
   * DELETE /api/workout-exercises/:workoutExerciseId
   * Deletes a specific exercise instance from a workout session.
   */
  deleteWorkoutExercise: async (req, res) => {
    const { workoutExerciseId } = req.params;
    const userId = req.user.id;

    try {
      await workoutExerciseService.deleteWorkoutExercise(
        workoutExerciseId,
        userId
      );
      // Use 200 or 204. 204 No Content is often preferred for DELETE if nothing is returned.
      res
        .status(200)
        .json({ message: "Workout exercise deleted successfully!" });
      // or res.status(204).send();
    } catch (error) {
      console.error("Delete Workout Exercise Error:", error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof ForbiddenError) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({
        message: "Error deleting workout exercise",
        error: error.message,
      });
    }
  },
};

export default workoutExerciseController;
