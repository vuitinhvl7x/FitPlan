// scripts/checkExercises.js (Ví dụ)
import { sequelize, Exercise } from "../models/index.js";

async function checkExercises() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    const count = await Exercise.count();
    console.log(`Total exercises in DB: ${count}`);

    const firstFive = await Exercise.findAll({ limit: 5 });
    console.log("First 5 exercises:");
    firstFive.forEach((ex) => {
      console.log(
        `- ${ex.name} (ID: ${ex.id}, API ID: ${ex.api_id}, Target: ${ex.target_muscle}, Body Part: ${ex.body_part})`
      );
    });
  } catch (error) {
    console.error("Error checking exercises:", error);
  } finally {
    await sequelize.close();
  }
}

checkExercises();
