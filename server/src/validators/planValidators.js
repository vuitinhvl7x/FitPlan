// server/src/validators/planValidators.js
// import { body, param } from "express-validator";

// TODO: Define validation rules for plan generation request body if needed.
// For a simple "generate based on profile", the body might be empty,
// or it might contain optional parameters like desired_duration_minutes, specific_focus_area, etc.

// export const generatePlanValidationRules = [
//   // Example: Optional field for desired plan duration in minutes per session
//   body('desired_duration_minutes')
//     .optional()
//     .isInt({ min: 15, max: 120 }) // Example range
//     .withMessage('Desired duration must be an integer between 15 and 120 minutes'),
//   // Example: Optional field for a specific focus area within the main goal
//   body('specific_focus_area')
//     .optional()
//     .isString()
//     .trim()
//     .withMessage('Specific focus area must be a string'),
// ];

// TODO: Add validation rules for other plan routes (e.g., update plan)
