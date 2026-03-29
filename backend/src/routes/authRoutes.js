
const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Photo upload
router.post('/users/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    const db = require('../models/database').db;
    db.run('UPDATE users SET profile_photo = ? WHERE id = ?', [photoUrl, req.user.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Photo uploaded successfully', photo_url: photoUrl });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;
