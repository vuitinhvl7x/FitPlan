"use strict";

export default {
  async up(queryInterface, Sequelize) {
    /**
     * Add indexes to the user_measurements table.
     */
    await queryInterface.addIndex("user_measurements", ["user_id"]);
    await queryInterface.addIndex("user_measurements", ["date"]);
    await queryInterface.addIndex("user_measurements", ["user_id", "date"]); // Add composite index

    // If you wanted a unique index:
    // await queryInterface.addIndex('user_measurements', ['user_id', 'date'], {
    //   unique: true,
    //   name: 'user_measurements_user_id_date_unique' // Give it a name
    // });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Remove indexes from the user_measurements table.
     */
    await queryInterface.removeIndex("user_measurements", ["user_id"]);
    await queryInterface.removeIndex("user_measurements", ["date"]);
    await queryInterface.removeIndex("user_measurements", ["user_id", "date"]); // Remove composite index

    // If you added a unique index:
    // await queryInterface.removeIndex('user_measurements', 'user_measurements_user_id_date_unique');
  },
};
