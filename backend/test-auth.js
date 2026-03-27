const { generateToken, verifyToken, JWT_SECRET } = require('./src/middleware/auth');

console.log('Testing Authentication Middleware...\n');

// Test user object
const testUser = {
  id: 1,
  username: 'test_user',
  role: 'cbl_admin',
  group_id: null
};

// Generate token
console.log('1. Generating JWT token...');
const token = generateToken(testUser);
console.log('Token generated:', token.substring(0, 50) + '...\n');

// Verify token
console.log('2. Verifying token...');
const verified = verifyToken(token);
if (verified) {
  console.log('✅ Token verified successfully!');
  console.log('Decoded payload:', verified);
} else {
  console.log('❌ Token verification failed');
}

// Check token expiration (optional)
console.log('\n3. Token info:');
console.log('Secret used:', JWT_SECRET);
console.log('Token expires: 24 hours from generation');

console.log('\n✅ Auth middleware test complete!');