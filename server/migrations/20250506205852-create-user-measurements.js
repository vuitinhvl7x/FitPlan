"use strict";

// Import DataTypes and sequelize from your models/index.js or db.js if needed
// If your models/index.js or db.js uses ES Modules, you might need dynamic import here
// const { DataTypes } = require('sequelize'); // If Sequelize is installed directly
// import { DataTypes } from 'sequelize'; // If Sequelize is installed directly and you can use import

// If you need access to your models or sequelize instance from src/models/index.js
// and it uses ES Modules, you might need dynamic import or pass them differently.
// For a simple table creation migration, you often only need the Sequelize object
// which is passed as the second argument to up/down functions.

export default {
  // Use export default
  async up(queryInterface, Sequelize) {
    // Sequelize object is passed here
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable(
      "user_measurements",
      {
        id: {
          type: Sequelize.UUID, // Use Sequelize object passed in
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "users", // Tên bảng trong DB (thường là số nhiều, snake_case)
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        weight: {
          type: Sequelize.FLOAT,
          allowNull: true,
        },
        height: {
          type: Sequelize.FLOAT,
          allowNull: true,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      },
      {
        tableName: "user_measurements", // Explicitly set table name
        // Optional: Add indexes here if needed
        // indexes: [
        //   { fields: ['user_id'] },
        //   { fields: ['date'] },
        //   { fields: ['user_id', 'date'], unique: true }
        // ]
      }
    );

    // Optional: Add indexes separately if needed
    // await queryInterface.addIndex('user_measurements', ['user_id']);
    // await queryInterface.addIndex('user_measurements', ['date']);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     */
    await queryInterface.dropTable("user_measurements");
  },
};
