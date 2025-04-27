// src/validators/exerciseValidators.js
import { body, param } from "express-validator";
import { Exercise } from "../models/index.js"; // Để lấy ENUMs nếu có

// Nếu bạn có ENUM cho target_muscle, body_part, equipment, bạn có thể lấy ở đây
// const targetMuscles = Exercise.getAttributes().target_muscle.values; // Nếu là ENUM
// const bodyParts = Exercise.getAttributes().body_part.values; // Nếu là ENUM
// const equipments = Exercise.getAttributes().equipment.values; // Nếu là ENUM

export const createExerciseValidationRules = [
  body("name").notEmpty().withMessage("Exercise name is required").trim(),
  // Các trường khác là tùy chọn khi tạo bài tập tùy chỉnh, nhưng nếu có thì validate
  body("instructions")
    .optional()
    .isString()
    .withMessage("Instructions must be a string")
    .trim(),
  body("target_muscle")
    .optional()
    .isString()
    .withMessage("Target muscle must be a string")
    .trim(),
  body("body_part")
    .optional()
    .isString()
    .withMessage("Body part must be a string")
    .trim(),
  body("equipment")
    .optional()
    .isString()
    .withMessage("Equipment must be a string")
    .trim(),
  body("media_url")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Media URL must be a valid URL"),
  body("secondary_muscles")
    .optional()
    .isArray()
    .withMessage("Secondary muscles must be an array of strings"),
  body("secondary_muscles.*")
    .optional()
    .isString()
    .withMessage("Each secondary muscle must be a string")
    .trim(),
  // api_id và is_custom sẽ được set trong controller, không nhận từ body
];

export const updateExerciseValidationRules = [
  // Validate ID trong params
  param("id").isUUID().withMessage("Invalid exercise ID format"),
  // Các trường cập nhật là optional, nhưng nếu có thì validate
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Exercise name cannot be empty")
    .trim(),
  body("instructions")
    .optional()
    .isString()
    .withMessage("Instructions must be a string")
    .trim(),
  body("target_muscle")
    .optional()
    .isString()
    .withMessage("Target muscle must be a string")
    .trim(),
  body("body_part")
    .optional()
    .isString()
    .withMessage("Body part must be a string")
    .trim(),
  body("equipment")
    .optional()
    .isString()
    .withMessage("Equipment must be a string")
    .trim(),
  body("media_url")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Media URL must be a valid URL"),
  body("secondary_muscles")
    .optional()
    .isArray()
    .withMessage("Secondary muscles must be an array of strings"),
  body("secondary_muscles.*")
    .optional()
    .isString()
    .withMessage("Each secondary muscle must be a string")
    .trim(),
  // Không cho phép cập nhật api_id hoặc is_custom qua route này
];
