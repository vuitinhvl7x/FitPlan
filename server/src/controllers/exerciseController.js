// src/controllers/exerciseController.js (Updated with CRUD)
import { Exercise } from "../models/index.js";
import { Op } from "sequelize";

const exerciseController = {
  // GET /api/exercises - Lấy danh sách bài tập
  getExercises: async (req, res) => {
    try {
      const {
        name,
        target_muscle,
        body_part,
        equipment,
        page = 1,
        limit = 20,
        sortBy = "name",
        sortOrder = "ASC",
      } = req.query;

      const where = {};
      if (name) {
        where.name = { [Op.iLike]: `%${name}%` };
      }
      if (target_muscle) {
        where.target_muscle = target_muscle;
      }
      if (body_part) {
        where.body_part = body_part;
      }
      if (equipment) {
        where.equipment = equipment;
      }

      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      const { count, rows } = await Exercise.findAndCountAll({
        where: where,
        limit: parseInt(limit, 10),
        offset: offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
      });

      res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / parseInt(limit, 10)),
        currentPage: parseInt(page, 10),
        exercises: rows,
      });
    } catch (error) {
      console.error("Get Exercises Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching exercises", error: error.message });
    }
  },

  // GET /api/exercises/:id - Lấy chi tiết một bài tập
  getExerciseById: async (req, res) => {
    const { id } = req.params;
    try {
      const exercise = await Exercise.findByPk(id);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found." });
      }
      res.status(200).json(exercise);
    } catch (error) {
      console.error("Get Exercise By ID Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching exercise", error: error.message });
    }
  },

  // POST /api/exercises - Tạo bài tập tùy chỉnh mới
  createExercise: async (req, res) => {
    const {
      name,
      instructions,
      target_muscle,
      body_part,
      equipment,
      media_url,
      secondary_muscles,
    } = req.body;

    try {
      // Tạo bài tập mới, đánh dấu là tùy chỉnh
      const newExercise = await Exercise.create({
        name,
        instructions,
        target_muscle,
        body_part,
        equipment,
        media_url,
        secondary_muscles,
        is_custom: true, // <-- Đánh dấu là bài tập tùy chỉnh
        api_id: null, // <-- Không có api_id cho bài tùy chỉnh
      });

      res.status(201).json({
        message: "Custom exercise created successfully!",
        exercise: newExercise,
      });
    } catch (error) {
      console.error("Create Exercise Error:", error);
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: "Validation Error", errors: messages });
      }
      res
        .status(500)
        .json({ message: "Error creating exercise", error: error.message });
    }
  },

  // PUT /api/exercises/:id - Cập nhật bài tập tùy chỉnh
  updateExercise: async (req, res) => {
    const { id } = req.params;
    const {
      name,
      instructions,
      target_muscle,
      body_part,
      equipment,
      media_url,
      secondary_muscles,
    } = req.body;

    try {
      const exercise = await Exercise.findByPk(id);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found." });
      }

      // Chỉ cho phép cập nhật bài tập tùy chỉnh
      if (!exercise.is_custom) {
        return res
          .status(403)
          .json({ message: "Cannot update non-custom exercises." });
      }

      // Tạo object chứa các trường được phép cập nhật
      const allowedUpdates = {};
      if (name !== undefined) allowedUpdates.name = name;
      if (instructions !== undefined)
        allowedUpdates.instructions = instructions;
      if (target_muscle !== undefined)
        allowedUpdates.target_muscle = target_muscle;
      if (body_part !== undefined) allowedUpdates.body_part = body_part;
      if (equipment !== undefined) allowedUpdates.equipment = equipment;
      if (media_url !== undefined) allowedUpdates.media_url = media_url;
      if (secondary_muscles !== undefined)
        allowedUpdates.secondary_muscles = secondary_muscles;

      if (Object.keys(allowedUpdates).length === 0) {
        return res
          .status(400)
          .json({ message: "No valid fields provided for update." });
      }

      await exercise.update(allowedUpdates);

      res.status(200).json({
        message: "Custom exercise updated successfully!",
        exercise: exercise,
      });
    } catch (error) {
      console.error("Update Exercise Error:", error);
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: "Validation Error", errors: messages });
      }
      res
        .status(500)
        .json({ message: "Error updating exercise", error: error.message });
    }
  },

  // DELETE /api/exercises/:id - Xóa bài tập tùy chỉnh
  deleteExercise: async (req, res) => {
    const { id } = req.params;
    try {
      const exercise = await Exercise.findByPk(id);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found." });
      }

      // Chỉ cho phép xóa bài tập tùy chỉnh
      if (!exercise.is_custom) {
        return res
          .status(403)
          .json({ message: "Cannot delete non-custom exercises." });
      }

      await exercise.destroy();

      res
        .status(200)
        .json({ message: "Custom exercise deleted successfully!" });
    } catch (error) {
      console.error("Delete Exercise Error:", error);
      res
        .status(500)
        .json({ message: "Error deleting exercise", error: error.message });
    }
  },
};

export default exerciseController;
