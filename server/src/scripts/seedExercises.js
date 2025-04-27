// scripts/seedExercises.js (Adjusted to fetch by bodyPart AND target)
import axios from "axios";
import dotenv from "dotenv";
import { sequelize, Exercise } from "../models/index.js"; // Import models và sequelize

dotenv.config(); // Load biến môi trường

// Thông tin ExerciseDB trên RapidAPI
const API_BASE_URL = "https://exercisedb.p.rapidapi.com";
const API_KEY = process.env.RAPIDAPI_KEY_EXERCISEDB; // Đảm bảo bạn có biến này trong .env
const API_HOST = "exercisedb.p.rapidapi.com"; // Đảm bảo host đúng

if (!API_KEY) {
  console.error("RAPIDAPI_KEY_EXERCISEDB is not set in environment variables.");
  process.exit(1); // Thoát nếu không có API Key
}

async function seedExercises() {
  try {
    // Kết nối DB
    await sequelize.authenticate();
    console.log("Database connection established for seeding.");

    // Đồng bộ model (chỉ cần nếu bạn chưa chạy migration cho thay đổi)
    // await sequelize.sync({ alter: true }); // Cẩn thận khi dùng sync({ alter: true }) trong môi trường đã có dữ liệu

    const allExercises = [];
    const uniqueExercisesMap = new Map(); // Dùng Map để theo dõi các bài tập duy nhất theo api_id

    // --- Fetch by Body Part ---
    console.log("Fetching body part list from ExerciseDB API...");
    try {
      const bodyPartListResponse = await axios.get(
        `${API_BASE_URL}/exercises/bodyPartList`,
        { headers: { "X-RapidAPI-Key": API_KEY, "X-RapidAPI-Host": API_HOST } }
      );
      const bodyPartList = bodyPartListResponse.data;

      if (!Array.isArray(bodyPartList) || bodyPartList.length === 0) {
        console.warn("Failed to fetch body part list or list is empty.");
      } else {
        console.log(`Fetched ${bodyPartList.length} body parts.`);
        for (const bodyPart of bodyPartList) {
          console.log(`Fetching exercises for body part: ${bodyPart}...`);
          try {
            const exercisesByBodyPartResponse = await axios.get(
              `${API_BASE_URL}/exercises/bodyPart/${bodyPart}`,
              {
                headers: {
                  "X-RapidAPI-Key": API_KEY,
                  "X-RapidAPI-Host": API_HOST,
                },
              }
            );
            // Thêm các bài tập vào Map, key là api_id, value là object bài tập
            exercisesByBodyPartResponse.data.forEach((ex) => {
              if (ex.id) uniqueExercisesMap.set(ex.id, ex);
            });
            console.log(
              `Fetched ${exercisesByBodyPartResponse.data.length} exercises for ${bodyPart}. Total unique collected so far: ${uniqueExercisesMap.size}`
            );
          } catch (error) {
            console.error(
              `Error fetching exercises for body part ${bodyPart}:`,
              error.message
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching body part list:", error.message);
    }

    // --- Fetch by Target ---
    console.log("Fetching target list from ExerciseDB API...");
    try {
      const targetListResponse = await axios.get(
        `${API_BASE_URL}/exercises/targetList`,
        { headers: { "X-RapidAPI-Key": API_KEY, "X-RapidAPI-Host": API_HOST } }
      );
      const targetList = targetListResponse.data;

      if (!Array.isArray(targetList) || targetList.length === 0) {
        console.warn("Failed to fetch target list or list is empty.");
      } else {
        console.log(`Fetched ${targetList.length} targets.`);
        for (const target of targetList) {
          console.log(`Fetching exercises for target: ${target}...`);
          try {
            const exercisesByTargetResponse = await axios.get(
              `${API_BASE_URL}/exercises/target/${target}`,
              {
                headers: {
                  "X-RapidAPI-Key": API_KEY,
                  "X-RapidAPI-Host": API_HOST,
                },
              }
            );
            // Thêm các bài tập vào Map, key là api_id, value là object bài tập
            exercisesByTargetResponse.data.forEach((ex) => {
              if (ex.id) uniqueExercisesMap.set(ex.id, ex);
            });
            console.log(
              `Fetched ${exercisesByTargetResponse.data.length} exercises for ${target}. Total unique collected so far: ${uniqueExercisesMap.size}`
            );
          } catch (error) {
            console.error(
              `Error fetching exercises for target ${target}:`,
              error.message
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching target list:", error.message);
    }

    // --- Fetch by Equipment (Optional - uncomment if needed) ---
    console.log("Fetching equipment list from ExerciseDB API...");
    try {
      const equipmentListResponse = await axios.get(
        `${API_BASE_URL}/exercises/equipmentList`,
        { headers: { "X-RapidAPI-Key": API_KEY, "X-RapidAPI-Host": API_HOST } }
      );
      const equipmentList = equipmentListResponse.data;

      if (!Array.isArray(equipmentList) || equipmentList.length === 0) {
        console.warn("Failed to fetch equipment list or list is empty.");
      } else {
        console.log(`Fetched ${equipmentList.length} equipments.`);
        for (const equipment of equipmentList) {
          console.log(`Fetching exercises for equipment: ${equipment}...`);
          try {
            const exercisesByEquipmentResponse = await axios.get(
              `${API_BASE_URL}/exercises/equipment/${equipment}`,
              {
                headers: {
                  "X-RapidAPI-Key": API_KEY,
                  "X-RapidAPI-Host": API_HOST,
                },
              }
            );
            // Thêm các bài tập vào Map, key là api_id, value là object bài tập
            exercisesByEquipmentResponse.data.forEach((ex) => {
              if (ex.id) uniqueExercisesMap.set(ex.id, ex);
            });
            console.log(
              `Fetched ${exercisesByEquipmentResponse.data.length} exercises for ${equipment}. Total unique collected so far: ${uniqueExercisesMap.size}`
            );
          } catch (error) {
            console.error(
              `Error fetching exercises for equipment ${equipment}:`,
              error.message
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching equipment list:", error.message);
    }

    // Convert the Map values back to an array for processing
    const uniqueExercises = Array.from(uniqueExercisesMap.values());

    console.log(
      `Finished fetching from API using multiple dimensions. Total unique exercises collected: ${uniqueExercises.length}`
    );

    console.log(
      `Processing ${uniqueExercises.length} unique exercises for seeding...`
    );

    let addedCount = 0;
    let skippedCount = 0;

    for (const apiExercise of uniqueExercises) {
      try {
        // Ánh xạ dữ liệu từ API response
        const exerciseData = {
          api_id: apiExercise.id, // Sử dụng ID từ API (STRING)
          name: apiExercise.name,
          is_custom: false,
          instructions: apiExercise.instructions
            ? apiExercise.instructions.join("\n")
            : null, // Nối mảng instructions
          target_muscle: apiExercise.target || null, // Sử dụng target
          body_part: apiExercise.bodyPart || null, // Sử dụng bodyPart
          equipment: apiExercise.equipment || null,
          media_url: apiExercise.gifUrl || null, // Sử dụng gifUrl
          secondary_muscles: apiExercise.secondaryMuscles || null, // Lưu mảng secondaryMuscles
        };

        // Tìm bài tập theo api_id (kiểu STRING)
        const existingExercise = await Exercise.findOne({
          where: { api_id: exerciseData.api_id },
        });

        if (existingExercise) {
          skippedCount++;
          // console.log(`Skipped existing exercise: ${exerciseData.name} (ID: ${exerciseData.api_id})`);
        } else {
          // Nếu chưa tồn tại, tạo mới
          await Exercise.create(exerciseData);
          addedCount++;
          // console.log(`Added new exercise: ${exerciseData.name} (ID: ${exerciseData.api_id})`);
        }
      } catch (error) {
        console.error(
          `Error processing exercise ${apiExercise.id || apiExercise.name}:`,
          error.message
        );
        skippedCount++; // Coi như bỏ qua bài tập này do lỗi
      }
    }

    console.log("Seeding complete.");
    console.log(
      `Added: ${addedCount}, Skipped (existing or error): ${skippedCount}`
    );
  } catch (error) {
    console.error("Error during exercise seeding:", error);
  } finally {
    // Đóng kết nối DB sau khi hoàn thành
    await sequelize.close();
    console.log("Database connection closed.");
  }
}

seedExercises();
