// src/models/UserMeasurement.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";
// No need to import User here for definition, only for association in index.js

const UserMeasurement = sequelize.define(
  "UserMeasurement",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      // Foreign key
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users", // Reference table name
        key: "id",
      },
      onDelete: "CASCADE", // Delete measurements if user is deleted
    },
    date: {
      // The date the measurement was taken
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    weight: {
      // in kilograms
      type: DataTypes.FLOAT,
      allowNull: true, // Allow null if only height is recorded
      validate: {
        min: 0,
      },
    },
    height: {
      // in centimeters
      type: DataTypes.FLOAT,
      allowNull: true, // Allow null if only weight is recorded
      validate: {
        min: 0,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "user_measurements",
    timestamps: true, // Track when the record was created/updated
    underscored: true, // Use snake_case
    indexes: [
      // Add indexes for faster lookups
      { fields: ["user_id"] },
      { fields: ["date"] },
      { fields: ["user_id", "date"] }, // Could potentially add unique constraint if only one measurement per day is allowed
    ],
  }
);

export default UserMeasurement;
