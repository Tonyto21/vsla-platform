const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./src/models/database');
const { register, login } = require('./src/controllers/authController');

// Mock Express req/res objects
const mockReq = (body) => ({
  body,
  ip: '127.0.0.1'
});

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function testAuthController() {
  console.log('Testing Auth Controller...\n');
  
  // Initialize database
  initDatabase();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 1: Register a new user
  console.log('1. Testing user registration...');
  const registerReq = mockReq({
    username: 'testmember',
    email: 'test@example.com',
    password: 'test123',
    full_name: 'Test Member',
    role: 'member',
    gender: 'female'
  });
  const registerRes = mockRes();
  
  await register(registerReq, registerRes);
  console.log('Registration result:', registerRes.data);
  
  if (registerRes.data.userId) {
    console.log('✅ User registered successfully with ID:', registerRes.data.userId);
  } else {
    console.log('❌ Registration failed:', registerRes.data.error);
  }
  
  // Test 2: Login with the new user
  console.log('\n2. Testing user login...');
  const loginReq = mockReq({
    username: 'testmember',
    password: 'test123'
  });
  const loginRes = mockRes();
  
  await login(loginReq, loginRes);
  console.log('Login result:', {
    hasToken: !!loginRes.data?.token,
    user: loginRes.data?.user
  });
  
  if (loginRes.data?.token) {
    console.log('✅ Login successful, token generated');
  } else {
    console.log('❌ Login failed:', loginRes.data?.error);
  }
  
  // Clean up - delete test user
  await new Promise((resolve) => {
    db.run('DELETE FROM users WHERE username = ?', ['testmember'], resolve);
  });
  
  console.log('\n✅ Auth controller tests complete!');
  
  // Close database
  setTimeout(() => db.close(), 1000);
}

testAuthController();