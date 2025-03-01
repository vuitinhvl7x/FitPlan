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
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    status: {
      type: DataTypes.ENUM("Active", "Completed", "Paused"),
      allowNull: false,
      defaultValue: "Active",
    },
    is_customized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "training_plans",
    timestamps: true,
    underscored: true,
  }
);

export default TrainingPlan;
