const { db } = require('../models/database');

const createGroup = async (req, res) => {
  const { name, location, meeting_day } = req.body;
  const leaderId = req.user.id;
  
  if (req.user.role !== 'group_leader' && req.user.role !== 'cbl_admin') {
    return res.status(403).json({ error: 'Only group leaders can create groups' });
  }
  
  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }
  
  db.run(
    `INSERT INTO groups (name, leader_id, location, meeting_day)
     VALUES (?, ?, ?, ?)`,
    [name, leaderId, location, meeting_day],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      const groupId = this.lastID;
      
      // Update user's group_id
      db.run('UPDATE users SET group_id = ? WHERE id = ?', [groupId, leaderId]);
      
      // Create wallet for leader
      db.run('INSERT INTO wallets (user_id, group_id) VALUES (?, ?)', [leaderId, groupId]);
      
      res.status(201).json({
        message: 'Group created successfully',
        groupId: groupId
      });
    }
  );
};

const getGroups = (req, res) => {
  let query = `
    SELECT g.*, 
           u.full_name as leader_name,
           COUNT(DISTINCT m.id) as member_count
    FROM groups g
    LEFT JOIN users u ON g.leader_id = u.id
    LEFT JOIN users m ON m.group_id = g.id
  `;
  
  const params = [];
  
  if (req.user.role !== 'cbl_admin') {
    query += ' WHERE g.id = ?';
    params.push(req.user.group_id);
  }
  
  query += ' GROUP BY g.id ORDER BY g.created_at DESC';
  
  db.all(query, params, (err, groups) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(groups);
  });
};

const getGroupById = (req, res) => {
  const { id } = req.params;
  
  db.get(
    `SELECT g.*, u.full_name as leader_name
     FROM groups g
     LEFT JOIN users u ON g.leader_id = u.id
     WHERE g.id = ?`,
    [id],
    (err, group) => {
      if (err || !group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Get members
      db.all(
        `SELECT id, full_name, username, role, gender, phone, created_at
         FROM users WHERE group_id = ?`,
        [id],
        (err, members) => {
          group.members = members || [];
          res.json(group);
        }
      );
    }
  );
};

const addMember = (req, res) => {
  const { groupId } = req.params;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  // Check if user exists and is not already in a group
  db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.group_id) {
      return res.status(400).json({ error: 'User already belongs to a group' });
    }
    
    // Add user to group
    db.run(
      'UPDATE users SET group_id = ? WHERE id = ?',
      [groupId, user_id],
      function(err) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        
        // Create wallet for user
        db.run('INSERT INTO wallets (user_id, group_id) VALUES (?, ?)', [user_id, groupId]);
        
        res.json({ message: 'Member added successfully' });
      }
    );
  });
};

module.exports = { createGroup, getGroups, getGroupById, addMember };