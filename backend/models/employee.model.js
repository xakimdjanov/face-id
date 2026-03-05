// models/employee.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      // associations
    }
  }
  
  Employee.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    employeeNo: {  // BU ID SIFATIDA ISHLATILADI
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    cardNo: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    phone: DataTypes.STRING,
    department: DataTypes.STRING,
    workStartTime: {
      type: DataTypes.STRING,
      defaultValue: '09:00'
    },
    workEndTime: {
      type: DataTypes.STRING,
      defaultValue: '21:00'
    },
    workDays: {
      type: DataTypes.JSON,
      defaultValue: [1, 2, 3, 4, 5]
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'Asia/Tashkent'
    },
    faceImage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    faceDescriptor: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Employee',
  });
  
  return Employee;
};