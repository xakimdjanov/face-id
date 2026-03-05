const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DeviceConfig = sequelize.define("DeviceConfig", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, defaultValue: "main", unique: true },

    ip: { type: DataTypes.STRING, allowNull: true },
    username: { type: DataTypes.STRING, allowNull: true, defaultValue: "admin" },
    password: { type: DataTypes.STRING, allowNull: true },

    // stream ishlayaptimi
    streamEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  });

  return DeviceConfig;
};
