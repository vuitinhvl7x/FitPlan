// server/src/services/planGeneratorService.js
import {
  sequelize,
  User,
  UserProfile,
  Exercise,
  TrainingPlan, // <-- Đảm bảo TrainingPlan được import
  WorkoutSession,
  WorkoutExercise,
} from "../models/index.js";
import { Op } from "sequelize"; // Import Op for filtering
import geminiService from "./geminiService.js";
import { format } from "date-fns"; // Consider installing date-fns for date manipulation: npm install date-fns

// Mapping training_location to available equipment
// This is a simplified example. You might need a more comprehensive mapping.
const equipmentMapping = {
  home: [
    "body weight",
    "dumbbell",
    "resistance band",
    "kettlebell",
    "medicine ball",
    "stability ball",
    "band",
    "assisted",
    "none",
  ],
  gym: [
    "barbell",
    "cable",
    "leverage machine",
    "olympic barbell",
    "smith machine",
    "trap bar",
    "weighted",
    "assisted",
    "dumbbell",
    "kettlebell",
    "medicine ball",
    "resistance band",
    "stability ball",
    "ez barbell",
    "hammer",
    "roller",
    "rope",
    "tire",
    "wheel roller", // Strength equipment
    "elliptical machine",
    "skierg machine",
    "stationary bike",
    "stepmill machine",
    "upper body ergometer",
    "cardio machine", // Cardio equipment
  ],
  outdoor: ["body weight", "assisted", "band", "resistance band", "none"],
  // Add other locations as needed
};

// Mapping activity_level to suggested weekly frequency
const frequencyMapping = {
  Sedentary: { min: 1, max: 2 },
  "Lightly Active": { min: 2, max: 3 },
  "Moderately Active": { min: 3, max: 4 },
  "Very Active": { min: 4, max: 5 },
  "Extremely Active": { min: 5, max: 6 },
};

const planGeneratorService = {
  /**
   * Generates a personalized training plan for a user using Gemini.
   * @param {string} userId The ID of the user.
   * @returns {Promise<object>} A promise that resolves with the created TrainingPlan object.
   * @throws {Error} If user/profile not found, Gemini API fails, or saving to DB fails.
   */
  generatePlan: async (userId) => {
    const transaction = await sequelize.transaction(); // Start a transaction

    try {
      // 1. Fetch User and Profile
      const user = await User.findByPk(userId, {
        include: [{ model: UserProfile, as: "profile" }],
        transaction, // Use transaction
      });

      if (!user || !user.profile) {
        // Rollback transaction before throwing error
        await transaction.rollback();
        throw new Error("User or User Profile not found.");
      }

      const userProfile = user.profile;

      // --- MODIFIED LOGIC: Check for ANY active plan ---
      const existingActivePlan = await TrainingPlan.findOne({
        where: {
          user_id: userId,
          status: "Active", // Still check ONLY for Active plans here
        },
        transaction, // Sử dụng transaction
      });

      if (existingActivePlan) {
        // If an Active plan exists, block generation
        await transaction.rollback(); // Rollback the transaction
        const activePlanError = new Error(
          "You already have an active training plan. Please complete or archive it before generating a new one."
        );
        activePlanError.status = 400; // Suggest status code for controller
        throw activePlanError;
      }
      // --- END MODIFIED LOGIC ---

      // --- NEW LOGIC: Find the most recently completed/archived plan for analysis ---
      const lastPlan = await TrainingPlan.findOne({
        where: {
          user_id: userId,
          status: { [Op.in]: ["Completed", "Archived"] }, // Look for completed or archived plans
        },
        order: [["end_date", "DESC"]], // Get the most recent one
        transaction,
      });

      let analysisSummary = null;
      if (lastPlan) {
        console.log(
          `Found last completed/archived plan (${lastPlan.id}) for analysis.`
        );
        // Fetch data for analysis from the last plan's period
        const dataStartDate = lastPlan.start_date;
        const dataEndDate = lastPlan.end_date;

        const sessionsWithResults = await WorkoutSession.findAll({
          where: { training_plan_id: lastPlan.id },
          include: [
            {
              model: WorkoutExercise,
              as: "workoutExercises",
              include: [
                { model: Exercise, as: "exercise" },
                { model: ExerciseResult, as: "results" },
              ],
            },
          ],
          transaction,
        });

        const dailyConditions = await UserDailyCondition.findAll({
          where: {
            user_id: user.id,
            date: {
              [Op.between]: [dataStartDate, dataEndDate],
            },
          },
          transaction,
        });

        analysisSummary = weeklyUpdateService._analyzeUserData(
          user.profile,
          sessionsWithResults,
          dailyConditions
        );
        console.log("Analysis Summary for new plan:", analysisSummary);
      } else {
        console.log(
          "No previous completed/archived plan found for analysis. Generating initial plan."
        );
        // Provide a default/empty analysis summary if no previous plan exists
        analysisSummary = {
          formattedPerformance: "No previous performance data.",
          formattedCondition: "No previous condition data.",
          rawData: {}, // Empty raw data
        };
      }
      // --- END NEW LOGIC ---

      // 2. Determine available equipment based on training location
      const location = userProfile.training_location
        ? userProfile.training_location.toLowerCase()
        : "unknown";
      const availableEquipment =
        equipmentMapping[location] || equipmentMapping["home"]; // Default to home if location unknown

      console.log(
        `Generating plan for user ${userId} at ${
          userProfile.training_location
        }. Available equipment: ${availableEquipment.join(", ")}`
      );

      // 3. Fetch and Filter Exercises from DB
      // Filter by available equipment.
      // Add filtering logic based on experience if you have a way to rate exercise difficulty.
      const availableExercises = await Exercise.findAll({
        where: {
          equipment: {
            [Op.in]: availableEquipment,
          },
          // TODO: Add filtering based on userProfile.experience if possible
          // Example (requires exercise difficulty rating):
          // difficulty_level: {
          //    [Op.lte]: userProfile.experience === 'Beginner' ? 2 : userProfile.experience === 'Intermediate' ? 4 : 5
          // }
        },
        attributes: [
          // Select specific attributes
          "id",
          "name",
          "target_muscle",
          "body_part",
          "equipment",
          "secondary_muscles",
        ],
        transaction, // Use transaction
      });

      if (availableExercises.length === 0) {
        // Rollback transaction before throwing error
        await transaction.rollback();
        throw new Error(
          `No exercises found in the database matching the user's training location (${userProfile.training_location}).`
        );
      }

      console.log(
        `Found ${availableExercises.length} exercises matching criteria.`
      );

      // 4. Create Exercise Name -> ID Lookup Map and list for prompt
      const exerciseLookupMap = new Map();
      const exerciseListForPrompt = availableExercises
        .map((ex) => {
          // Store lookup for later
          exerciseLookupMap.set(ex.name.toLowerCase(), ex.id); // Use lowercase for robust lookup

          // Format for the prompt (concise)
          return `- ${ex.name} (Target: ${
            ex.target_muscle || "N/A"
          }, Body Part: ${ex.body_part || "N/A"}, Equipment: ${
            ex.equipment || "N/A"
          }, Secondary: ${
            ex.secondary_muscles && ex.secondary_muscles.length > 0
              ? ex.secondary_muscles.join(", ")
              : "None"
          })`;
        })
        .join("\n");

      // 5. Construct the Prompt for Gemini
      const suggestedFrequency = frequencyMapping[
        userProfile.activity_level
      ] || { min: 3, max: 4 }; // Default if activity level is unexpected

      // Determine start date for the new plan - should be tomorrow
      const nextWeekStartDate = addDays(new Date(), 1);
      const nextWeekEndDate = addDays(nextWeekStartDate, 6); // 1 week plan

      const prompt = `
  Generate a 1-week personalized training plan in JSON format for the upcoming week.
  
  User Profile:
  - Goal: ${userProfile.goals}
  - Experience Level: ${userProfile.experience}
  - Activity Level: ${userProfile.activity_level}
  - Training Location: ${userProfile.training_location}
  - Preferred Training Days: ${
    userProfile.preferred_training_days &&
    userProfile.preferred_training_days.length > 0
      ? userProfile.preferred_training_days.join(", ")
      : "Any"
  }
  - Weight: ${userProfile.weight || "N/A"} kg
  - Height: ${userProfile.height || "N/A"} cm
  - Wants Pre-Workout Info: ${userProfile.wants_pre_workout_info ? "Yes" : "No"}
  
  ${
    analysisSummary
      ? `Previous Training Period Analysis:\n--- Performance Summary ---\n${analysisSummary.formattedPerformance}\n--- Daily Condition Summary ---\n${analysisSummary.formattedCondition}`
      : "No previous training data available for analysis."
  }
  
  Plan Requirements for the Upcoming Week:
  - Duration: 1 week, starting from tomorrow (${formatDateForPrompt(
    nextWeekStartDate
  )}).
  - Frequency: Suggest a training frequency appropriate for the user's activity level (${
    userProfile.activity_level
  }), ideally scheduling between ${suggestedFrequency.min} and ${
        suggestedFrequency.max
      } sessions per week. Prioritize preferred days if specified.
  - Session Duration: Suggest appropriate duration for each session (e.g., 30-60 minutes).
  - Focus: Align the plan structure, exercise selection, sets, reps, and rest periods with the user's primary goal (${
    userProfile.goals
  }) and experience level (${userProfile.experience}).
  - **Adaptation:** If previous data is available, critically analyze the "Previous Training Period Analysis" and adjust the plan accordingly.
    - If performance was strong on an exercise, consider slightly increasing weight, reps, or sets.
    - If performance was weak or an exercise was skipped often, consider reducing weight, reps, sets, or suggesting an easier variation or alternative exercise from the list.
    - If daily conditions (energy, stress, sleep, soreness) were poor, suggest more rest days, lower intensity sessions, or focus on recovery activities.
    - If daily conditions were good, the user might handle higher volume/intensity.
    - If there's no previous data, generate a standard plan based on profile.
  - Exercises: ONLY use exercises from the list provided below. Provide the EXACT name from the list if possible. If an exact match isn't suitable, suggest a very common variation that is likely to be in the list or can be easily mapped. If a suitable exercise cannot be found for a planned muscle group/body part from the list, you can suggest "Rest" or "Cardio (choose activity)".
  - Pre-Workout Notes: If the user wants pre-workout info, include a brief note or suggestion at the beginning of each session's notes.
  - Output Format: JSON object.
  
  Available Exercises (Name, Target Muscle, Body Part, Equipment, Secondary Muscles):
  ${exerciseListForPrompt}
  
  JSON Output Structure:
  {
    "planName": "string", // A suggested name for the training plan (e.g., "Week 2: Muscle Gain Adjusted")
    "description": "string", // A brief description of the plan, mentioning the adjustments made based on last week (if data available)
    "sessions": [
      {
        "day": "string", // e.g., "Monday", "Tuesday", etc.
        "name": "string", // e.g., "Upper Body Workout", "Cardio Session", "Rest Day"
        "exercises": [ // Array of exercises for this session. Can be empty for Rest Day.
          {
            "exerciseName": "string", // The name of the exercise (must be from or very similar to the available list)
            "sets": "number | string | null", // e.g., 3, "3-4", null for cardio
            "reps": "number | string | null", // e.g., 10, "8-12", null for timed
            "weight": "string | null", // e.g., "Bodyweight", "50kg", "Adjust as needed", null
            "duration": "number | null", // Duration in seconds for timed exercises, null otherwise
            "rest": "number | null", // Rest period in seconds after the exercise/set, null if not applicable
            "notes": "string | null" // Specific notes for this exercise in this session
          }
          // ... more exercises for this session
        ],
        "notes": "string | null" // General notes for the session (e.g., warm-up, cool-down, pre-workout info, summary of session focus)
      }
      // ... more sessions for the week (7 sessions total for a 1-week plan)
    ]
  }
  
  Ensure the output is valid JSON and contains ONLY the JSON object. Do not include any introductory or concluding text outside the JSON.
  `;

      console.log("Prompt constructed. Calling Gemini...");

      // 6. Call Gemini API
      // Lưu ý: Gọi API ngoài transaction scope.
      const planJson = await geminiService.generateJson(prompt);

      // 7. Validate and Save Plan to Database
      // Basic validation of the top-level structure
      if (
        !planJson ||
        !Array.isArray(planJson.sessions) ||
        planJson.sessions.length === 0
      ) {
        // Rollback transaction before throwing error
        await transaction.rollback();
        throw new Error("Gemini returned an invalid or empty plan structure.");
      }

      // Determine start date for the new plan - should be tomorrow
      // Already calculated as nextWeekStartDate above

      const createdPlan = await TrainingPlan.create(
        {
          user_id: userId,
          name: planJson.planName || `${userProfile.goals} Plan`, // Use generated name or default
          description:
            planJson.description || `1-week plan for ${userProfile.goals}`,
          start_date: nextWeekStartDate,
          end_date: nextWeekEndDate,
          status: "Active", // Đặt trạng thái là Active
          is_customized: false, // Generated plans are not customized initially
        },
        { transaction }
      );

      console.log(`TrainingPlan created with ID: ${createdPlan.id}`);

      // Map day names to date objects for the week
      const dayMap = {};
      const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(nextWeekStartDate, i);
        const dayName = daysOfWeek[currentDate.getDay()];
        dayMap[dayName.toLowerCase()] = format(currentDate, "yyyy-MM-dd"); // Store as YYYY-MM-DD string
      }

      for (const sessionData of planJson.sessions) {
        const sessionDate = dayMap[sessionData.day.toLowerCase()]; // Get date string from map

        if (!sessionDate) {
          console.warn(`Skipping session for unknown day: ${sessionData.day}`);
          continue; // Skip if day name is invalid
        }

        const createdSession = await WorkoutSession.create(
          {
            training_plan_id: createdPlan.id,
            name: sessionData.name || `${sessionData.day} Workout`,
            date: sessionDate, // Use the calculated date
            status: "Planned", // Trạng thái ban đầu của session
            notes: sessionData.notes,
            // duration_planned could be parsed from sessionData if Gemini provides it
          },
          { transaction }
        );

        console.log(
          `WorkoutSession created for ${sessionData.day} (${sessionDate}) with ID: ${createdSession.id}`
        );

        if (Array.isArray(sessionData.exercises)) {
          for (let i = 0; i < sessionData.exercises.length; i++) {
            const exerciseData = sessionData.exercises[i];
            const exerciseNameLower = exerciseData.exerciseName
              ? exerciseData.exerciseName.toLowerCase()
              : null;
            const exerciseId = exerciseNameLower
              ? exerciseLookupMap.get(exerciseNameLower)
              : null;

            if (!exerciseId) {
              console.warn(
                `Could not find exercise ID for name: "${exerciseData.exerciseName}". Skipping this exercise in session ${createdSession.id}.`
              );
              continue; // Skip if exercise name from Gemini doesn't match our DB
            }

            await WorkoutExercise.create(
              {
                workout_session_id: createdSession.id,
                exercise_id: exerciseId,
                order: i, // Use index as order
                sets_planned:
                  typeof exerciseData.sets === "number"
                    ? exerciseData.sets
                    : null, // Only save numbers
                reps_planned:
                  typeof exerciseData.reps === "number"
                    ? exerciseData.reps
                    : null, // Only save numbers
                weight_planned:
                  typeof exerciseData.weight === "number"
                    ? exerciseData.weight
                    : null, // Only save numbers if number
                duration_planned:
                  typeof exerciseData.duration === "number"
                    ? exerciseData.duration
                    : null, // Only save numbers
                rest_period:
                  typeof exerciseData.rest === "number"
                    ? exerciseData.rest
                    : null, // Only save numbers
                notes:
                  typeof exerciseData.notes === "string"
                    ? exerciseData.notes
                    : null,
                status: "Planned", // Default status for new exercises
              },
              { transaction }
            );
            console.log(
              `  - Added exercise "${exerciseData.exerciseName}" (ID: ${exerciseId}) to session.`
            );
          }
        }
      }

      await transaction.commit(); // Commit the transaction if all steps succeed
      console.log("Plan generation and saving complete.");
      return createdPlan; // Return the created plan object
    } catch (error) {
      // Catch block sẽ tự động rollback transaction nếu có lỗi xảy ra ở bất kỳ đâu trong try block
      // Bao gồm cả lỗi kiểm tra plan active, lỗi fetch DB, lỗi gọi API, lỗi parse JSON, lỗi lưu DB.
      await transaction.rollback();
      console.error("Error during plan generation process:", error); // Log lỗi chi tiết hơn
      throw error; // Re-throw the error to be handled by the controller
    }
  },

  // TODO: Add other plan-related services here (e.g., getPlan, updatePlan, deletePlan)
};

// Re-use or define equipment mapping helper
const _getEquipmentForLocation = (location) => {
  const equipmentMapping = {
    home: [
      "body weight",
      "dumbbell",
      "resistance band",
      "kettlebell",
      "medicine ball",
      "stability ball",
      "band",
      "assisted",
      "none",
    ],
    gym: [
      "barbell",
      "cable",
      "leverage machine",
      "olympic barbell",
      "smith machine",
      "trap bar",
      "weighted",
      "assisted",
      "dumbbell",
      "kettlebell",
      "medicine ball",
      "resistance band",
      "stability ball",
      "ez barbell",
      "hammer",
      "roller",
      "rope",
      "tire",
      "wheel roller",
      "elliptical machine",
      "skierg machine",
      "stationary bike",
      "stepmill machine",
      "upper body ergometer",
      "cardio machine",
    ],
    outdoor: ["body weight", "assisted", "band", "resistance band", "none"],
  };
  return equipmentMapping[location.toLowerCase()] || equipmentMapping["home"];
};

// Helper function to format date for prompt
const formatDateForPrompt = (date) => format(date, "yyyy-MM-dd");

// Import the analysis function from weeklyUpdateService
import weeklyUpdateService from "./weeklyUpdateService.js"; // <-- Import here

// Add the analysis function directly or import it
// For simplicity and avoiding circular dependencies if weeklyUpdateService
// also imports planGeneratorService, it might be better to define
// the analysis logic here or in a shared utility file.
// Let's import it for now, assuming no circular dependency issues.
// If issues arise, copy the _analyzeUserData and _constructGeminiPrompt logic here.

export default planGeneratorService;
