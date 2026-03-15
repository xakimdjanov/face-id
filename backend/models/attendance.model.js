const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AttendanceLog = sequelize.define(
    "AttendanceLog",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      deviceName: { type: DataTypes.STRING, allowNull: false, defaultValue: "main" },

      employeeNo: { type: DataTypes.STRING, allowNull: true },
      name: { type: DataTypes.STRING, allowNull: true }, // DB’da xodim nomi ham chiqishi uchun
      cardNo: { type: DataTypes.STRING, allowNull: true },
      doorNo: { type: DataTypes.STRING, allowNull: true },

      direction: { type: DataTypes.STRING, allowNull: false, defaultValue: "IN" }, // hozircha faqat IN
      status: { type: DataTypes.STRING, allowNull: true }, // success/fail
      dateTime: { type: DataTypes.DATE, allowNull: true },

      raw: { type: DataTypes.JSONB, allowNull: true },
    },
    { indexes: [{ fields: ["deviceName"] }, { fields: ["employeeNo"] }, { fields: ["dateTime"] }] }
  );

  return AttendanceLog;
};
