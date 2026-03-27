const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Make sure you have a db.js exporting your Sequelize instance

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('cbl_admin','group_leader','member'),
    defaultValue: 'member',
  },
  profile_photo: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;