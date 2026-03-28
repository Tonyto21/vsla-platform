const { Group } = require('../models');

async function createGroup(req, res) {
  try {
    const group = await Group.create(req.body);
    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getAllGroups(req, res) {
  try {
    const groups = await Group.findAll();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createGroup,
  getAllGroups
};