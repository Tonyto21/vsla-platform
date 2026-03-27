const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const Loan = sequelize.define('Loan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.ENUM('active','repaid','defaulted'), defaultValue: 'active' },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  groupId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'loans',
  timestamps: true,
});

Loan.belongsTo(User, { foreignKey: 'userId' });

module.exports = Loan;