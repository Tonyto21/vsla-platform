const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
// Photo upload route
const upload = require('../middleware/upload');
router.post('/users/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    
    // Update user's profile_photo in database
    const db = require('../models/database').db;
    db.run(
      'UPDATE users SET profile_photo = ? WHERE id = ?',
      [photoUrl, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ 
          message: 'Photo uploaded successfully',
          photo_url: photoUrl
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;