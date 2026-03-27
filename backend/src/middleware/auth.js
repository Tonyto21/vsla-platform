const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'vsla-secret-key-change-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

const checkGroupAccess = (req, res, next) => {
  const userId = req.user.id;
  const groupId = req.params.groupId || req.body.group_id;
  
  // CBL admins have access to all groups
  if (req.user.role === 'cbl_admin') {
    return next();
  }
  
  // Check if user belongs to the group
  db.get(
    'SELECT * FROM users WHERE id = ? AND group_id = ?',
    [userId, groupId],
    (err, user) => {
      if (err || !user) {
        return res.status(403).json({ error: 'Access denied to this group' });
      }
      next();
    }
  );
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      group_id: user.group_id 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Helper function to verify token (for testing)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { 
  authenticateToken, 
  authorize, 
  checkGroupAccess,
  generateToken,
  verifyToken,
  JWT_SECRET
};