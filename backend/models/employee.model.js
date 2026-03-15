const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Employee = sequelize.define(
    "Employee",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      employeeNo: { type: DataTypes.STRING, allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },

      cardNo: { type: DataTypes.STRING, allowNull: true, unique: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      department: { type: DataTypes.STRING, allowNull: true },
    },
    { indexes: [{ fields: ["employeeNo"] }, { fields: ["cardNo"] }] }
  );

  return Employee;
};
