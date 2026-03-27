const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('../src/models/database');

async function createTestUsers() {
  console.log('Creating test users...');
  
  // Hash password
  const passwordHash = await bcrypt.hash('password123', 10);
  
  // Create CBL Admin
  db.run(
    `INSERT OR REPLACE INTO users (username, email, password_hash, full_name, role, gender)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['cbl_admin', 'admin@cbl.gov.lr', passwordHash, 'Central Bank Admin', 'cbl_admin', 'other'],
    function(err) {
      if (err) console.error('Error creating admin:', err);
      else console.log('✅ CBL Admin created (username: cbl_admin, password: password123)');
    }
  );
  
  // Create a test member
  db.run(
    `INSERT OR REPLACE INTO users (username, email, password_hash, full_name, role, gender)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['testmember', 'test@example.com', passwordHash, 'Test Member', 'member', 'female'],
    function(err) {
      if (err) console.error('Error creating test member:', err);
      else console.log('✅ Test Member created (username: testmember, password: password123)');
    }
  );
  
  // Create a test group leader
  db.run(
    `INSERT OR REPLACE INTO users (username, email, password_hash, full_name, role, gender)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['testleader', 'leader@example.com', passwordHash, 'Test Leader', 'group_leader', 'male'],
    function(err) {
      if (err) console.error('Error creating test leader:', err);
      else console.log('✅ Test Group Leader created (username: testleader, password: password123)');
    }
  );
  
  // Wait a bit to ensure all inserts complete
  setTimeout(() => {
    console.log('\n✅ Test users created successfully!');
    console.log('\nLogin credentials:');
    console.log('-------------------');
    console.log('Admin:    cbl_admin / password123');
    console.log('Member:   testmember / password123');
    console.log('Leader:   testleader / password123');
    db.close();
  }, 1000);
}

// Initialize database and create users
initDatabase();
setTimeout(() => createTestUsers(), 1000);