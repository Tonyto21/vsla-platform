const { Sequelize } = require('sequelize');
const UserModel = require('./User');
const GroupModel = require('./Group');
const ContributionModel = require('./Contribution');
const LoanModel = require('./Loan');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // local DB
});

const User = UserModel(sequelize);
const Group = GroupModel(sequelize);
const Contribution = ContributionModel(sequelize);
const Loan = LoanModel(sequelize);

// Associations
User.belongsTo(Group);
Group.hasMany(User);

Contribution.belongsTo(User);
User.hasMany(Contribution);

Loan.belongsTo(User);
User.hasMany(Loan);

sequelize.sync({ force: false })
  .then(() => console.log('Database initialized successfully'))
  .catch(err => console.error('Database init error:', err));

module.exports = {
  sequelize,
  User,
  Group,
  Contribution,
  Loan
};