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
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "full_name", // Explicitly map to snake_case column
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        // Hash password automatically before saving
        if (value) {
          const salt = bcrypt.genSaltSync(10);
          this.setDataValue("password", bcrypt.hashSync(value, salt));
        }
      },
    },
    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
      allowNull: true, // Or false if required at registration
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY, // Only store the date part
      allowNull: true, // Or false if required at registration
      field: "date_of_birth",
      validate: {
        isDate: true,
      },
    },
    // Add other user-specific fields if needed (e.g., profile picture URL)
  },
  {
    tableName: "users",
    timestamps: true, // Automatically add createdAt and updatedAt
    underscored: true, // Use snake_case for column names and foreign keys
  }
);

export default User;
