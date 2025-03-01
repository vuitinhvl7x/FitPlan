// src/models/Exercise.js
import { DataTypes } from "sequelize";
import sequelize from "../providers/db.js";

const Exercise = sequelize.define(
  "Exercise",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    api_id: {
      type: DataTypes.INTEGER,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_custom: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    muscle_group: {
      type: DataTypes.STRING,
    },
    equipment: {
      type: DataTypes.STRING,
    },
    media_url: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "exercises",
    timestamps: true,
    underscored: true,
  }
);

export default Exercise;
