// src/models/User.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";
import bcrypt from "bcrypt";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    full_name: {
      // Changed to snake_case to match underscored: true
      type: DataTypes.STRING,
      allowNull: false,
      field: "full_name", // Explicitly map to snake_case column
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: "Username must be unique",
      },
    },
    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
      allowNull: false,
    },
    date_of_birth: {
      // Changed to snake_case
      type: DataTypes.DATEONLY,
      field: "date_of_birth",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: "Email must be unique",
      },
      validate: {
        isEmail: {
          msg: "Must be a valid email address",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [6, 128],
          msg: "Password must be between 6 and 128 characters",
        },
      },
      set(value) {
        // Only hash if the value is not already a hash (or during updates)
        if (value && value.length < 60) {
          // Basic check: bcrypt hashes are typically 60 chars
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(value, salt);
          this.setDataValue("password", hash);
        } else {
          // If it looks like a hash already, or is empty, don't re-hash
          // Be cautious with this logic if password updates are complex
          this.setDataValue("password", value);
        }
      },
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true, // Use snake_case for DB columns (e.g., created_at, updated_at)
  }
);

// Instance method to check password (optional but convenient)
User.prototype.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default User;
