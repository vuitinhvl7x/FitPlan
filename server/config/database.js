// config/database.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Sequelize configuration object
const config = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "", // <-- Thêm || "" ở đây
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "postgres",
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "", // <-- Thêm || "" ở đây
    database: process.env.DB_NAME_TEST || "your_test_db",
    host: process.env.DB_HOST,
    dialect: "postgres",
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "", // <-- Thêm || "" ở đây
    database: process.env.DB_NAME_PROD || "your_prod_db",
    host: process.env.DB_HOST,
    dialect: "postgres",
  },
};

export default config;
