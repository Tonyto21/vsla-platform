const { User, Contribution, Loan, Group } = require('../models');

async function getUsers(req, res) {
  try {
    const users = await User.findAll({ include: [Group, Contribution, Loan] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getGroups(req, res) {
  try {
    const groups = await Group.findAll({ include: User });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getUsers,
  getGroups
};