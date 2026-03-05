// models/AttendanceLog.js
module.exports = (sequelize, DataTypes) => {
  const AttendanceLog = sequelize.define("AttendanceLog", {
    employeeNo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
    },
    cardNo: {
      type: DataTypes.STRING,
    },
    dateTime: {
      type: DataTypes.DATE,
    },
    deviceName: {
      type: DataTypes.STRING,
      defaultValue: "main",
    },
    doorNo: {
      type: DataTypes.STRING,
    },
    verifyMode: {
      type: DataTypes.STRING,
    },
    // Yangi qo'shilgan maydonlar
    attendanceStatus: {
      type: DataTypes.ENUM('checkIn', 'checkOut', 'unknown'),
      defaultValue: 'unknown'
    },
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    checkOutTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    label: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return AttendanceLog;
};