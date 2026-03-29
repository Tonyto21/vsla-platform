const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('../src/models/database');

async function seedData() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Clear existing data in correct order (respect foreign keys)
  db.serialize(() => {
    db.run('DELETE FROM notifications');
    db.run('DELETE FROM audit_logs');
    db.run('DELETE FROM loan_repayments');
    db.run('DELETE FROM transactions');
    db.run('DELETE FROM loans');
    db.run('DELETE FROM wallets');
    db.run('DELETE FROM users');
    db.run('DELETE FROM groups');
    db.run('DELETE FROM exchange_rates');
  });

  // Wait for deletions to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  // Create CBL Admin
  await new Promise((resolve) => {
    db.run(
      `INSERT INTO users (username, email, password_hash, full_name, role, gender) VALUES (?, ?, ?, ?, ?, ?)`,
      ['cbl_admin', 'admin@cbl.gov.lr', passwordHash, 'Central Bank Admin', 'cbl_admin', 'other'],
      resolve
    );
  });
  console.log('✅ CBL Admin created');

  // Create groups
  const groups = [
    { name: 'Peace Market VSLA', location: 'Monrovia', meeting_day: 'Monday' },
    { name: 'Women Empowerment Group', location: 'Paynesville', meeting_day: 'Wednesday' },
    { name: 'Youth Savings Group', location: 'Buchanan', meeting_day: 'Friday' }
  ];

  for (const group of groups) {
    await new Promise((resolve) => {
      db.run(
        `INSERT INTO groups (name, location, meeting_day) VALUES (?, ?, ?)`,
        [group.name, group.location, group.meeting_day],
        resolve
      );
    });
  }
  console.log('✅ 3 groups created');

  // Get group IDs
  const groupsList = await new Promise((resolve) => {
    db.all('SELECT id, name FROM groups', (err, rows) => resolve(rows || []));
  });
  const groupMap = {};
  groupsList.forEach(g => { groupMap[g.name] = g.id; });

  // Create group leaders
  const leaders = [
    { username: 'maria_johnson', email: 'maria@example.com', full_name: 'Maria Johnson', group: 'Peace Market VSLA', gender: 'female' },
    { username: 'grace_williams', email: 'grace@example.com', full_name: 'Grace Williams', group: 'Women Empowerment Group', gender: 'female' },
    { username: 'john_doe', email: 'john@example.com', full_name: 'John Doe', group: 'Youth Savings Group', gender: 'male' }
  ];

  for (const leader of leaders) {
    const groupId = groupMap[leader.group];
    if (!groupId) {
      console.log(`❌ Group not found for leader: ${leader.group}`);
      continue;
    }

    const userId = await new Promise((resolve) => {
      db.run(
        `INSERT INTO users (username, email, password_hash, full_name, role, group_id, gender) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [leader.username, leader.email, passwordHash, leader.full_name, 'group_leader', groupId, leader.gender],
        function(err) {
          if (err) {
            console.error('Error creating leader:', err);
            resolve(null);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });

    if (userId) {
      await new Promise((resolve) => {
        db.run('UPDATE groups SET leader_id = ? WHERE id = ?', [userId, groupId], resolve);
      });
      await new Promise((resolve) => {
        db.run('INSERT INTO wallets (user_id, group_id, usd_balance, lrd_balance) VALUES (?, ?, 0, 0)', [userId, groupId], resolve);
      });
    }
  }
  console.log('✅ 3 group leaders created');

  // Create members
  const members = [
    { username: 'sarah_johnson', email: 'sarah@example.com', full_name: 'Sarah Johnson', group: 'Peace Market VSLA', gender: 'female' },
    { username: 'michael_brown', email: 'michael@example.com', full_name: 'Michael Brown', group: 'Peace Market VSLA', gender: 'male' },
    { username: 'lisa_anderson', email: 'lisa@example.com', full_name: 'Lisa Anderson', group: 'Women Empowerment Group', gender: 'female' },
    { username: 'robert_taylor', email: 'robert@example.com', full_name: 'Robert Taylor', group: 'Youth Savings Group', gender: 'male' },
    { username: 'jennifer_martin', email: 'jennifer@example.com', full_name: 'Jennifer Martin', group: 'Women Empowerment Group', gender: 'female' }
  ];

  for (const member of members) {
    const groupId = groupMap[member.group];
    if (!groupId) {
      console.log(`❌ Group not found for member: ${member.group}`);
      continue;
    }

    const userId = await new Promise((resolve) => {
      db.run(
        `INSERT INTO users (username, email, password_hash, full_name, role, group_id, gender) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [member.username, member.email, passwordHash, member.full_name, 'member', groupId, member.gender],
        function(err) {
          if (err) {
            console.error('Error creating member:', err);
            resolve(null);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });

    if (userId) {
      await new Promise((resolve) => {
        db.run('INSERT INTO wallets (user_id, group_id, usd_balance, lrd_balance) VALUES (?, ?, 0, 0)', [userId, groupId], resolve);
      });
    }
  }
  console.log('✅ 5 members created');

  // Get all users for deposits
  const usersList = await new Promise((resolve) => {
    db.all('SELECT id, username FROM users', (err, rows) => resolve(rows || []));
  });
  const userMap = {};
  usersList.forEach(u => { userMap[u.username] = u.id; });

  // Sample deposits
  const deposits = [
    { user: 'sarah_johnson', amount: 500, currency: 'USD', group: 'Peace Market VSLA' },
    { user: 'michael_brown', amount: 25000, currency: 'LRD', group: 'Peace Market VSLA' },
    { user: 'lisa_anderson', amount: 300, currency: 'USD', group: 'Women Empowerment Group' },
    { user: 'robert_taylor', amount: 15000, currency: 'LRD', group: 'Youth Savings Group' },
    { user: 'jennifer_martin', amount: 100, currency: 'USD', group: 'Women Empowerment Group' }
  ];

  for (const deposit of deposits) {
    const userId = userMap[deposit.user];
    const groupId = groupMap[deposit.group];
    if (userId && groupId) {
      const updateField = deposit.currency === 'USD' ? 'usd_balance' : 'lrd_balance';
      await new Promise((resolve) => {
        db.run(`UPDATE wallets SET ${updateField} = ${updateField} + ? WHERE user_id = ? AND group_id = ?`, [deposit.amount, userId, groupId], resolve);
      });
      await new Promise((resolve) => {
        db.run(
          `INSERT INTO transactions (user_id, group_id, type, amount, currency, description, reference, exchange_rate, usd_equivalent) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, groupId, 'deposit', deposit.amount, deposit.currency, 'Initial deposit', `INIT-${Date.now()}`, 185, deposit.currency === 'USD' ? deposit.amount : deposit.amount / 185],
          resolve
        );
      });
    }
  }
  console.log('✅ Deposits added');

  // Sample loans
  const loans = [
    { user: 'sarah_johnson', amount: 2000, currency: 'USD', interest: 10, duration: 6, status: 'active', group: 'Peace Market VSLA' },
    { user: 'lisa_anderson', amount: 50000, currency: 'LRD', interest: 12, duration: 12, status: 'repaid', group: 'Women Empowerment Group' },
    { user: 'robert_taylor', amount: 300, currency: 'USD', interest: 8, duration: 3, status: 'requested', group: 'Youth Savings Group' }
  ];

  for (const loan of loans) {
    const userId = userMap[loan.user];
    const groupId = groupMap[loan.group];
    if (userId && groupId) {
      await new Promise((resolve) => {
        db.run(
          `INSERT INTO loans (user_id, group_id, amount, currency, interest_rate, duration_months, status, remaining_balance) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, groupId, loan.amount, loan.currency, loan.interest, loan.duration, loan.status, loan.amount],
          resolve
        );
      });
    }
  }
  console.log('✅ Loans added');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('--------------------------------------------------');
  console.log('Admin:    cbl_admin / password123');
  console.log('Leader:   maria_johnson / password123');
  console.log('Member:   sarah_johnson / password123');
  console.log('--------------------------------------------------\n');

  // Close database connection
  db.close();
}

// Initialize database and run seed
initDatabase();
setTimeout(() => seedData(), 1000);
