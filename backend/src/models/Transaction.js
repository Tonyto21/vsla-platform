const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: { type: DataTypes.ENUM('deposit','loan_repayment'), allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  currency: { type: DataTypes.STRING, defaultValue: 'USD' },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  groupId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'transactions',
  timestamps: true,
});

Transaction.belongsTo(User, { foreignKey: 'userId' });

module.exports = Transaction;