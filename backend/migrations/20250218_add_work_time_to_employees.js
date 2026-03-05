// migrations/20250218_add_work_time_to_employees.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Employees');
    const columns = Object.keys(tableInfo);
    
    const updates = [];
    
    if (!columns.includes('workStartTime')) {
      updates.push(queryInterface.addColumn('Employees', 'workStartTime', {
        type: Sequelize.STRING,
        allowNull: true,
      }));
    }
    
    if (!columns.includes('workEndTime')) {
      updates.push(queryInterface.addColumn('Employees', 'workEndTime', {
        type: Sequelize.STRING,
        allowNull: true,
      }));
    }
    
    if (!columns.includes('workDays')) {
      updates.push(queryInterface.addColumn('Employees', 'workDays', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [1, 2, 3, 4, 5]
      }));
    }
    
    if (!columns.includes('timezone')) {
      updates.push(queryInterface.addColumn('Employees', 'timezone', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Asia/Tashkent'
      }));
    }
    
    await Promise.all(updates);
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Employees');
    const columns = Object.keys(tableInfo);
    
    const removes = [];
    
    if (columns.includes('workStartTime')) {
      removes.push(queryInterface.removeColumn('Employees', 'workStartTime'));
    }
    
    if (columns.includes('workEndTime')) {
      removes.push(queryInterface.removeColumn('Employees', 'workEndTime'));
    }
    
    if (columns.includes('workDays')) {
      removes.push(queryInterface.removeColumn('Employees', 'workDays'));
    }
    
    if (columns.includes('timezone')) {
      removes.push(queryInterface.removeColumn('Employees', 'timezone'));
    }
    
    await Promise.all(removes);
  }
};