// src/models/TrainingPlan.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";
import User from "./User.js";

const TrainingPlan = sequelize.define(
  "TrainingPlan",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE", // Added for consistency if user is deleted
    },
    name: {
      // Added field
      type: DataTypes.STRING,
      allowNull: true, // Or false if you want to require a name
      comment:
        "User-friendly name for the training plan (e.g., 'My Summer Bulk Plan')",
    },
    description: {
      // Added field
      type: DataTypes.TEXT,
      allowNull: true, // Description is optional
      comment: "Optional longer description of the plan's goals or focus",
    },
    start_date: {
      type: DataTypes.DATE, // Consider DATEONLY if time part is irrelevant
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    end_date: {
      type: DataTypes.DATE, // Consider DATEONLY if time part is irrelevant
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    status: {
      type: DataTypes.ENUM("Active", "Completed", "Paused", "Archived"), // Added 'Archived' status
      allowNull: false,
      defaultValue: "Active",
    },
    is_customized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment:
        "Indicates if the plan was modified by the user after generation",
    },
  },
  {
    tableName: "training_plans",
    timestamps: true,
    underscored: true,
  }
);

export default TrainingPlan;
