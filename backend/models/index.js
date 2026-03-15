const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    logging: false,
  }
);

const DeviceConfig = require("./deviceconfig.model")(sequelize);
const Employee = require("./employee.model")(sequelize);
const AttendanceLog = require("./attendance.model")(sequelize);

module.exports = { sequelize, DeviceConfig, Employee, AttendanceLog };
