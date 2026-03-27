const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database/vsla.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('cbl_admin', 'group_leader', 'treasurer', 'member')),
      group_id INTEGER,
      gender TEXT,
      phone TEXT,
      profile_photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
    )
  `);

  // Groups table
  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      leader_id INTEGER,
      treasurer_id INTEGER,
      location TEXT,
      meeting_day TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (leader_id) REFERENCES users(id),
      FOREIGN KEY (treasurer_id) REFERENCES users(id)
    )
  `);

  // Wallets table
  db.run(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      usd_balance DECIMAL(15,2) DEFAULT 0,
      lrd_balance DECIMAL(15,2) DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      UNIQUE(user_id, group_id)
    )
  `);

  // Transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal', 'loan_disbursement', 'loan_repayment')),
      amount DECIMAL(15,2) NOT NULL,
      currency TEXT NOT NULL CHECK(currency IN ('USD', 'LRD')),
      exchange_rate DECIMAL(15,6),
      usd_equivalent DECIMAL(15,2),
      description TEXT,
      reference TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    )
  `);

  // Loans table
  db.run(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      currency TEXT NOT NULL CHECK(currency IN ('USD', 'LRD')),
      interest_rate DECIMAL(5,2) NOT NULL,
      duration_months INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('requested', 'approved', 'disbursed', 'active', 'repaid', 'defaulted')),
      approved_by INTEGER,
      approved_at DATETIME,
      disbursed_at DATETIME,
      due_date DATE,
      remaining_balance DECIMAL(15,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `);

  // Loan repayments table
  db.run(`
    CREATE TABLE IF NOT EXISTS loan_repayments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      currency TEXT NOT NULL,
      exchange_rate DECIMAL(15,6),
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loan_id) REFERENCES loans(id)
    )
  `);

  // Audit logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Exchange rates cache
  db.run(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      base_currency TEXT NOT NULL,
      target_currency TEXT NOT NULL,
      rate DECIMAL(15,6) NOT NULL,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database initialized successfully');
};

module.exports = { db, initDatabase };