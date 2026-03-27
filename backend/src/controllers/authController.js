const bcrypt = require('bcryptjs');
const { db } = require('../models/database');
const { generateToken } = require('../middleware/auth');

const register = async (req, res) => {
  const { username, email, password, full_name, role, group_id, gender, phone, profile_photo } = req.body;
  
  // Validate required fields
  if (!username || !email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Validate role
  const validRoles = ['cbl_admin', 'group_leader', 'treasurer', 'member'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  try {
    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const userId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, email, password_hash, full_name, role, group_id, gender, phone, profile_photo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, hashedPassword, full_name, role, group_id || null, gender, phone, profile_photo || null],
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });
    
    // Create wallet for user if they belong to a group
    if (group_id) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO wallets (user_id, group_id) VALUES (?, ?)',
          [userId, group_id],
          (err) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
    }
    
    // Log audit
    db.run(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'user_registration', 'user', userId, `User ${username} registered`]
    );
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: userId 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  try {
    // Get user
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ? AND is_active = 1',
        [username],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
    
    // Generate token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      group_id: user.group_id
    });
    
    // Log audit
    db.run(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, 'user_login', 'user', user.id, `User ${username} logged in`, req.ip]
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        group_id: user.group_id,
        email: user.email,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getCurrentUser = (req, res) => {
  db.get(
    `SELECT u.id, u.username, u.email, u.full_name, u.role, u.group_id, u.gender, u.phone, u.created_at,
            g.name as group_name
     FROM users u
     LEFT JOIN groups g ON u.group_id = g.id
     WHERE u.id = ?`,
    [req.user.id],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
};

module.exports = { register, login, getCurrentUser };