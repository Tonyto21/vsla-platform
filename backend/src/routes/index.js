const express = require('express');
const router = express.Router();
const { getUsers, getGroups } = require('../controllers/reportController');
const { createGroup, getAllGroups } = require('../controllers/groupController');

// Users
router.get('/users', getUsers);

// Groups
router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.get('/all-groups', getAllGroups);

module.exports = router;