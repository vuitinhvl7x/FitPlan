// src/services/weeklyUpdateService.js
import {
  sequelize,
  User,
  UserProfile,
  TrainingPlan,
  WorkoutSession,
  WorkoutExercise,
  Exercise,
  ExerciseResult,
  UserDailyCondition,
} from "../models/index.js";
import { Op } from "sequelize"; // Import Op for filtering
import {
  addDays,
  startOfWeek,
  endOfWeek,
  format,
  isPast,
  subDays,
} from "date-fns"; // npm install date-fns
import geminiService from "./geminiService.js";
// No longer need to import planService here for cascading, it calls us now.
// import { planService } from "./planService.js";

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

// Helper function to format date for prompt
const formatDateForPrompt = (date) => format(date, "yyyy-MM-dd");

const weeklyUpdateService = {
  /**
   * --- NEW FUNCTION ---
   * Generates the next training plan for a specific user based on their performance and condition.
   * This is triggered when the previous plan is marked as Completed.
   * @param {string} userId The ID of the user.
   * @param {object} transaction The existing Sequelize transaction object.
   * @returns {Promise<TrainingPlan>} The newly created TrainingPlan object.
   * @throws {Error} If user/profile not found, Gemini API fails, or saving to DB fails.
   */
  generateNextPlanForUser: async (userId, transaction) => {
    try {
      console.log(
        `Generating next plan for user ID: ${userId} within transaction.`
      );

      // 1. Fetch User and Profile (using the provided transaction)
      const user = await User.findByPk(userId, {
        include: [{ model: UserProfile, as: "profile" }],
        transaction, // Use provided transaction
      });

      if (!user || !user.profile) {
        // Do NOT rollback here, the caller handles the transaction.
        throw new Error(
          "User or User Profile not found for next plan generation."
        );
      }

      const userProfile = user.profile;

      // 2. Collect data from the *just completed* plan
      // Find the plan that was just completed (should be the one that triggered this)
      const completedPlan = await TrainingPlan.findOne({
        where: { user_id: userId, status: "Completed" },
        order: [["end_date", "DESC"]], // Get the most recently completed plan
        transaction,
      });

      if (!completedPlan) {
        // This is unexpected if triggered correctly, but handle defensively
        console.warn(
          `generateNextPlanForUser: No completed plan found for user ${userId}. Cannot generate next plan.`
        );
        return null; // Or throw a specific error if this should never happen
      }

      const dataStartDate = completedPlan.start_date; // Analyze the duration of the completed plan
      const dataEndDate = completedPlan.end_date; // Analyze up to the end date of the completed plan

      console.log(
        `Analyzing data from completed plan (${
          completedPlan.id
        }) from ${formatDateForPrompt(dataStartDate)} to ${formatDateForPrompt(
          dataEndDate
        )}`
      );

      // Fetch sessions, exercises, results for the completed plan
      const sessionsWithResults = await WorkoutSession.findAll({
        where: { training_plan_id: completedPlan.id },
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
        transaction, // Use provided transaction
      });

      // Fetch daily conditions for the user within the completed plan's date range
      const dailyConditions = await UserDailyCondition.findAll({
        where: {
          user_id: user.id,
          date: {
            [Op.between]: [dataStartDate, dataEndDate],
          },
        },
        transaction, // Use provided transaction
      });

      // 3. Analyze performance and condition data
      const analysisSummary = weeklyUpdateService._analyzeUserData(
        user.profile,
        sessionsWithResults,
        dailyConditions
      );

      console.log("Analysis Summary for next plan:", analysisSummary);

      // 4. Fetch available exercises for the prompt (using the provided transaction)
      const availableExercises = await Exercise.findAll({
        where: {
          equipment: {
            [Op.in]: weeklyUpdateService._getEquipmentForLocation(
              user.profile.training_location
            ),
          },
        },
        attributes: [
          "id",
          "name",
          "target_muscle",
          "body_part",
          "equipment",
          "secondary_muscles",
        ],
        transaction, // Use provided transaction
      });

      const exerciseListForPrompt = availableExercises
        .map((ex) => {
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

      const exerciseLookupMap = new Map();
      availableExercises.forEach((ex) =>
        exerciseLookupMap.set(ex.name.toLowerCase(), ex.id)
      );

      // 5. Construct the Prompt for Gemini
      const prompt = weeklyUpdateService._constructGeminiPrompt(
        user.profile,
        analysisSummary,
        exerciseListForPrompt
      );

      console.log("Constructed Gemini prompt for next plan. Calling AI...");

      // 6. Call Gemini API (NOTE: AI call is outside the DB transaction scope by nature)
      // If the AI call fails, the DB transaction will still be rolled back by the caller.
      // If the AI call succeeds but saving fails, the DB transaction will also be rolled back.
      // This is acceptable.
      const planJson = await geminiService.generateJson(prompt);

      // 7. Validate and Save New Plan to Database (using the provided transaction)
      if (
        !planJson ||
        !Array.isArray(planJson.sessions) ||
        planJson.sessions.length === 0
      ) {
        // Do NOT rollback here, the caller handles the transaction.
        throw new Error(
          "AI returned an invalid or empty plan structure for the next week."
        );
      }

      // Determine start date for the new plan - should be the day after the completed plan ended
      const nextWeekStartDate = addDays(completedPlan.end_date, 1);
      const nextWeekEndDate = addDays(nextWeekStartDate, 6); // 1 week plan

      const newPlan = await TrainingPlan.create(
        {
          user_id: user.id,
          name:
            planJson.planName ||
            `${user.profile.goals} Plan (Week ${
              /* calculate week number */ 2
            })`, // Suggest a name
          description:
            planJson.description ||
            `Weekly updated plan for ${user.profile.goals}`,
          start_date: nextWeekStartDate,
          end_date: nextWeekEndDate,
          status: "Active", // New plan is Active
          is_customized: false, // AI generated plan is not customized initially
        },
        { transaction } // Use provided transaction
      );

      console.log(
        `New TrainingPlan created with ID: ${newPlan.id} for user ${userId}.`
      );

      // Map day names to date objects for the next week
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
          console.warn(
            `Skipping session for unknown day: ${sessionData.day} in AI response for user ${userId}.`
          );
          continue; // Skip if day name is invalid
        }

        const createdSession = await WorkoutSession.create(
          {
            training_plan_id: newPlan.id,
            name: sessionData.name || `${sessionData.day} Workout`,
            date: sessionDate, // Use the calculated date
            status: "Planned", // Initial status
            notes: sessionData.notes,
            // duration_planned could be parsed from sessionData if Gemini provides it
          },
          { transaction } // Use provided transaction
        );

        console.log(
          `WorkoutSession created for ${sessionData.day} (${sessionDate}) with ID: ${createdSession.id} for user ${userId}.`
        );

        if (Array.isArray(sessionData.exercises)) {
          for (let i = 0; i < sessionData.exercises.length; i++) {
            const exerciseData = sessionData.exercises[i];
            const exerciseNameLower = exerciseData.exerciseName
              ? exerciseData.exerciseName.toLowerCase()
              : null;
            const exerciseId = exerciseNameLower
              ? exerciseLookupMap.get(exerciseNameLower) // Use the lookup map
              : null;

            if (!exerciseId) {
              console.warn(
                `Could not find exercise ID for name: "${exerciseData.exerciseName}" from AI response in available exercises for user ${userId}. Skipping this exercise in session ${createdSession.id}.`
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
              { transaction } // Use provided transaction
            );
            console.log(
              `  - Added exercise "${exerciseData.exerciseName}" (ID: ${exerciseId}) to session ${createdSession.id} for user ${userId}.`
            );
          }
        }
      }

      console.log(`Next plan generation complete for user ${userId}.`);
      return newPlan; // Return the created plan object
    } catch (error) {
      // Do NOT rollback here, the caller handles the transaction.
      console.error(
        `Error during next plan generation for user ${userId}:`,
        error
      );
      throw error; // Re-throw the error to be handled by the caller
    }
  },

  /**
   * Runs the scheduled task to handle overdue plans.
   * This function would typically be called by a scheduled job (e.g., node-cron).
   */
  runScheduledOverduePlanHandler: async () => {
    // Renamed for clarity
    console.log("Starting scheduled overdue plan handler task...");
    const today = new Date();
    const oneWeekAgo = subDays(today, 7); // Look for plans that ended up to a week ago

    try {
      // 1. Find users with Active plans that are overdue (end_date is in the past)
      const overduePlans = await TrainingPlan.findAll({
        where: {
          status: "Active",
          end_date: {
            [Op.lt]: today, // Plan ended BEFORE today
            // Optional: Add a lower bound if you don't want to process very old plans
            // [Op.gte]: oneWeekAgo, // Plan ended within the last week
          },
        },
        include: [
          {
            model: User,
            as: "user",
            include: [{ model: UserProfile, as: "profile" }],
          }, // Include user and profile
          {
            model: WorkoutSession,
            as: "sessions",
            attributes: ["id", "date", "status"],
          }, // Include sessions to check their dates/statuses
        ],
      });

      console.log(`Found ${overduePlans.length} overdue active plans.`);

      for (const plan of overduePlans) {
        const transaction = await sequelize.transaction(); // Transaction per overdue plan
        try {
          console.log(
            `Processing overdue plan ${plan.id} for user ${plan.user_id}...`
          );

          // --- NEW LOGIC: Mark overdue sessions/exercises as Skipped ---
          let sessionsUpdated = false;
          for (const session of plan.sessions) {
            // Only process sessions that are not already Completed/Skipped
            if (session.status === "Planned" || session.status === "Skipped") {
              // Include Skipped here? Or only Planned? Let's process Planned.
              if (isPast(session.date, { unit: "day" })) {
                console.log(
                  `Session ${session.id} date ${session.date} is in the past and status is ${session.status}. Marking as Skipped.`
                );
                session.status = "Skipped";
                await session.save({ transaction });
                sessionsUpdated = true;

                // Also mark all exercises within this session as Skipped if not completed
                await WorkoutExercise.update(
                  { status: "Skipped" },
                  {
                    where: {
                      workout_session_id: session.id,
                      status: { [Op.in]: ["Planned", "Started"] }, // Only update Planned or Started exercises
                    },
                    transaction,
                  }
                );
                console.log(
                  `Marked exercises in session ${session.id} as Skipped.`
                );
              }
            }
          }

          // Reload plan sessions if any were updated to get the latest statuses for the filter below
          if (sessionsUpdated) {
            await plan.reload({
              include: [
                {
                  model: WorkoutSession,
                  as: "sessions",
                  attributes: ["id", "status"],
                },
              ],
              transaction,
            });
            console.log(
              `Plan ${plan.id} sessions reloaded after marking some as Skipped.`
            );
          }
          // --- END NEW LOGIC ---

          // Check if the plan is now fully completed/skipped after marking overdue sessions
          const totalSessions = plan.sessions.length;
          const completedOrSkippedCount = plan.sessions.filter(
            (session) =>
              session.status === "Completed" || session.status === "Skipped"
          ).length;

          if (completedOrSkippedCount === totalSessions) {
            // All sessions are now done or skipped, mark plan as Completed/Archived
            plan.status = "Completed"; // Or 'Archived' if you prefer for overdue plans
            await plan.save({ transaction });
            console.log(`Overdue plan ${plan.id} status updated to Completed.`);

            // Optional: Trigger next plan generation here IF you want a new plan
            // for users whose old plan was just marked completed by the task.
            // This might be redundant if they already got a new plan via the other trigger.
            // Decide if you want *any* completed plan to trigger a new one, or only plans
            // completed by user action. For now, let's rely on the user-action trigger.
            // If you DO want to trigger here, call:
            // await weeklyUpdateService.generateNextPlanForUser(plan.user_id, transaction);
          } else {
            // If the plan is overdue but still has Planned/Started sessions after marking past ones,
            // it means the user likely abandoned it mid-week. Mark it as Archived.
            plan.status = "Archived";
            await plan.save({ transaction });
            console.log(
              `Overdue plan ${plan.id} status updated to Archived (partially completed).`
            );
          }

          await transaction.commit(); // Commit the transaction for this overdue plan
          console.log(`Overdue plan ${plan.id} processing complete.`);
        } catch (planError) {
          await transaction.rollback(); // Rollback transaction for this overdue plan
          console.error(
            `Error processing overdue plan ${plan.id} for user ${plan.user_id}:`,
            planError
          );
          // Continue to the next overdue plan even if one fails
        }
      }

      console.log("Scheduled overdue plan handler task finished.");
    } catch (mainError) {
      console.error(
        "Error during scheduled overdue plan handler task:",
        mainError
      );
      // This catch block handles errors finding overdue plans or other top-level issues
    }
  },

  /**
   * Analyzes user data (profile, performance, condition) to create a summary for the AI prompt.
   * @param {object} userProfile
   * @param {Array<object>} sessionsWithResults - WorkoutSession objects with nested data.
   * @param {Array<object>} dailyConditions - UserDailyCondition objects.
   * @returns {object} A summary object.
   */
  _analyzeUserData: (userProfile, sessionsWithResults, dailyConditions) => {
    const summary = {
      performance: {
        totalSessionsPlanned: 0,
        totalSessionsCompleted: 0, // Only count sessions marked Completed
        totalSessionsSkipped: 0, // Count sessions marked Skipped
        completionRate: 0, // Based on Completed / Planned
        exercisePerformance: {}, // e.g., { "Push-ups": { planned: { sets: 3, reps: 10 }, actual: { sets: 3, reps: 12, weight: 0 }, skipped: false }, ... }
        overallNotes: [], // Notes from sessions/exercises
      },
      condition: {
        averageSleepHours: null,
        averageSleepQuality: null,
        averageEnergyLevel: null,
        averageStressLevel: null,
        averageMuscleSoreness: null,
        conditionNotes: [], // Notes from daily conditions
      },
      // Add other relevant analysis
    };

    // Analyze Performance
    summary.performance.totalSessionsPlanned = sessionsWithResults.length;
    sessionsWithResults.forEach((session) => {
      if (session.status === "Completed") {
        summary.performance.totalSessionsCompleted++;
      } else if (session.status === "Skipped") {
        summary.performance.totalSessionsSkipped++;
      }
      if (session.notes)
        summary.performance.overallNotes.push(
          `Session ${session.name}: ${session.notes}`
        );

      session.workoutExercises.forEach((we) => {
        const exerciseName = we.exercise
          ? we.exercise.name
          : "Unknown Exercise";
        if (!summary.performance.exercisePerformance[exerciseName]) {
          summary.performance.exercisePerformance[exerciseName] = {
            planned: { sets: 0, reps: 0, weight: 0, duration: 0, count: 0 },
            actual: { sets: 0, reps: 0, weight: 0, duration: 0, count: 0 },
            skippedCount: 0,
            notes: [],
          };
        }

        const perf = summary.performance.exercisePerformance[exerciseName];
        perf.planned.sets += we.sets_planned || 0;
        perf.planned.reps += we.reps_planned || 0;
        perf.planned.weight += we.weight_planned || 0; // Simple sum, might need average
        perf.planned.duration += we.duration_planned || 0;
        perf.planned.count++;

        if (we.status === "Skipped") {
          perf.skippedCount++;
        } else if (we.status === "Completed") {
          // Only analyze results for completed exercises
          // Analyze results if available
          if (we.results && we.results.length > 0) {
            perf.actual.sets += we.results.length; // Count logged sets
            we.results.forEach((result) => {
              perf.actual.reps += result.reps_completed || 0;
              perf.actual.weight += result.weight_used || 0; // Simple sum, might need average
              perf.actual.duration += result.duration_completed || 0;
              if (result.notes)
                perf.notes.push(
                  `- ${exerciseName} (Set ${result.set_number}): ${result.notes}`
                );
            });
            perf.actual.count++; // Count instances with results
          }
        }
        if (we.notes)
          perf.notes.push(`- ${exerciseName} (Planned Note): ${we.notes}`);
      });
    });

    // Recalculate completion rate based on Completed sessions
    summary.performance.completionRate =
      summary.performance.totalSessionsPlanned > 0
        ? (summary.performance.totalSessionsCompleted /
            summary.performance.totalSessionsPlanned) *
          100
        : 0;

    // Analyze Condition
    if (dailyConditions.length > 0) {
      const total = dailyConditions.length;
      const sum = dailyConditions.reduce(
        (acc, cond) => {
          acc.sleepHours += cond.sleep_hours || 0;
          acc.sleepQuality += cond.sleep_quality || 0;
          acc.energyLevel += cond.energy_level || 0;
          acc.stressLevel += cond.stress_level || 0;
          acc.muscleSoreness += cond.muscle_soreness || 0;
          if (cond.notes)
            acc.conditionNotes.push(
              `- ${formatDateForPrompt(cond.date)}: ${cond.notes}`
            );
          return acc;
        },
        {
          sleepHours: 0,
          sleepQuality: 0,
          energyLevel: 0,
          stressLevel: 0,
          muscleSoreness: 0,
          conditionNotes: [],
        }
      );

      summary.condition.averageSleepHours = sum.sleepHours / total;
      summary.condition.averageSleepQuality = sum.sleepQuality / total;
      summary.condition.averageEnergyLevel = sum.energyLevel / total;
      summary.condition.averageStressLevel = sum.stressLevel / total;
      summary.condition.averageMuscleSoreness = sum.muscleSoreness / total;
      summary.condition.conditionNotes = sum.conditionNotes;
    }

    // Format exercise performance for prompt
    const formattedExercisePerformance = Object.entries(
      summary.performance.exercisePerformance
    )
      .map(([name, data]) => {
        const plannedStr = `Planned: ${data.planned.sets} sets, ${data.planned.reps} reps, ${data.planned.weight}kg, ${data.planned.duration}s`;
        const actualStr = `Actual: ${data.actual.sets} sets logged, ${data.actual.reps} reps total, ${data.actual.weight}kg total, ${data.actual.duration}s total`;
        const skippedStr =
          data.skippedCount > 0 ? `, Skipped: ${data.skippedCount} times` : "";
        const notesStr =
          data.notes.length > 0 ? `\n    Notes: ${data.notes.join("; ")}` : "";
        return `- ${name}: ${plannedStr} | ${actualStr}${skippedStr}${notesStr}`;
      })
      .join("\n");

    const formattedConditionSummary = `
    Average Sleep Hours: ${
      summary.condition.averageSleepHours
        ? summary.condition.averageSleepHours.toFixed(1)
        : "N/A"
    }
    Average Sleep Quality (1-5): ${
      summary.condition.averageSleepQuality
        ? summary.condition.averageSleepQuality.toFixed(1)
        : "N/A"
    }
    Average Energy Level (1-5): ${
      summary.condition.averageEnergyLevel
        ? summary.condition.averageEnergyLevel.toFixed(1)
        : "N/A"
    }
    Average Stress Level (1-5): ${
      summary.condition.averageStressLevel
        ? summary.condition.averageStressLevel.toFixed(1)
        : "N/A"
    }
    Average Muscle Soreness (1-5): ${
      summary.condition.averageMuscleSoreness
        ? summary.condition.averageMuscleSoreness.toFixed(1)
        : "N/A"
    }
    Condition Notes: ${
      summary.condition.conditionNotes.length > 0
        ? summary.condition.conditionNotes.join("; ")
        : "None"
    }
       `;

    return {
      formattedPerformance: `
    Overall Session Completion Rate: ${summary.performance.completionRate.toFixed(
      1
    )}% (Completed sessions)
    Total Sessions Skipped: ${summary.performance.totalSessionsSkipped}
    Exercise Details:
    ${formattedExercisePerformance || "No exercise data logged."}
    Overall Session Notes: ${
      summary.performance.overallNotes.length > 0
        ? summary.performance.overallNotes.join("; ")
        : "None"
    }
          `,
      formattedCondition: formattedConditionSummary,
      // Return raw data too if needed for more complex rules
      rawData: summary,
    };
  },

  /**
   * Constructs the prompt string for the Gemini API.
   * @param {object} userProfile
   * @param {object} analysisSummary - The summary object from _analyzeUserData.
   * @param {string} exerciseListForPrompt - Formatted string of available exercises.
   * @returns {string} The prompt string.
   */
  _constructGeminiPrompt: (
    userProfile,
    analysisSummary,
    exerciseListForPrompt
  ) => {
    const suggestedFrequency = frequencyMapping[userProfile.activity_level] || {
      min: 3,
      max: 4,
    }; // Default if activity level is unexpected

    return `
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
    - Wants Pre-Workout Info: ${
      userProfile.wants_pre_workout_info ? "Yes" : "No"
    }
  
    Previous Week Analysis:
    --- Performance Summary ---
    ${analysisSummary.formattedPerformance}
    --- Daily Condition Summary ---
    ${analysisSummary.formattedCondition}
  
    Plan Requirements for the Upcoming Week:
    - Duration: 1 week, starting from tomorrow.
    - Frequency: Suggest a training frequency appropriate for the user's activity level (${
      userProfile.activity_level
    }), ideally scheduling between ${suggestedFrequency.min} and ${
      suggestedFrequency.max
    } sessions per week. Prioritize preferred days if specified.
    - Session Duration: Suggest appropriate duration for each session (e.g., 30-60 minutes).
    - Focus: Align the plan structure, exercise selection, sets, reps, and rest periods with the user's primary goal (${
      userProfile.goals
    }) and experience level (${userProfile.experience}).
    - **Adaptation:** Critically analyze the "Previous Week Analysis" and adjust the plan accordingly.
      - If performance was strong on an exercise, consider slightly increasing weight, reps, or sets.
      - If performance was weak or an exercise was skipped often, consider reducing weight, reps, sets, or suggesting an easier variation or alternative exercise from the list.
      - If daily conditions (energy, stress, sleep, soreness) were poor, suggest more rest days, lower intensity sessions, or focus on recovery activities.
      - If daily conditions were good, the user might handle higher volume/intensity.
    - Exercises: ONLY use exercises from the list provided below. Provide the EXACT name from the list if possible. If an exact match isn't suitable, suggest a very common variation that is likely to be in the list or can be easily mapped. If a suitable exercise cannot be found for a planned muscle group/body part from the list, you can suggest "Rest" or "Cardio (choose activity)".
    - Pre-Workout Notes: If the user wants pre-workout info, include a brief note or suggestion at the beginning of each session's notes.
    - Output Format: JSON object.
  
    Available Exercises (Name, Target Muscle, Body Part, Equipment, Secondary Muscles):
    ${exerciseListForPrompt}
  
    JSON Output Structure:
    {
      "planName": "string", // A suggested name for the training plan (e.g., "Week 2: Muscle Gain Adjusted")
      "description": "string", // A brief description of the plan, mentioning the adjustments made based on last week
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
  },

  // Re-use or define equipment mapping helper
  _getEquipmentForLocation: (location) => {
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
  },

  // TODO: Add a function to be called by node-cron, e.g., triggerWeeklyUpdate()
  // This function would call runWeeklyUpdateTask()
};

export default weeklyUpdateService;
