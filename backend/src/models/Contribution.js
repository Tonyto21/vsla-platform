const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Contribution', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  });
};