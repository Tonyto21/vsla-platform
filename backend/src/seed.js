// backend/src/seed.js
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const db = require('./models'); // this should point to your models/index.js

async function seed() {
  try {
    console.log('Seeding database...');

    // Drop all tables
    await db.Loan.drop();
    await db.Contribution.drop();
    await db.User.drop();
    await db.Group.drop();

    // Recreate tables
    await db.Group.sync({ force: true });
    await db.User.sync({ force: true });
    await db.Contribution.sync({ force: true });
    await db.Loan.sync({ force: true });

    // Create groups
    const cblGroup = await db.Group.create({
      name: 'CBL Admin Group',
      description: 'Admins of the VSLA system'
    });

    const leaderGroup = await db.Group.create({
      name: 'Leader Group',
      description: 'Leaders of VSLA groups'
    });

    const userGroup = await db.Group.create({
      name: 'User Group',
      description: 'Regular members'
    });

    // Passwords: hashed
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const leaderPassword = await bcrypt.hash('leader123', saltRounds);
    const userPassword = await bcrypt.hash('user123', saltRounds);

    // Create users
    const admin = await db.User.create({
      name: 'CBL Admin',
      email: 'admin@vsla.com',
      password: adminPassword,
      GroupId: cblGroup.id
    });

    const leader = await db.User.create({
      name: 'Leader User',
      email: 'leader@vsla.com',
      password: leaderPassword,
      GroupId: leaderGroup.id
    });

    const user = await db.User.create({
      name: 'Regular User',
      email: 'user@vsla.com',
      password: userPassword,
      GroupId: userGroup.id
    });

    // Sample contributions
    await db.Contribution.create({
      amount: 500,
      date: new Date(),
      UserId: leader.id
    });

    await db.Contribution.create({
      amount: 200,
      date: new Date(),
      UserId: user.id
    });

    // Sample loans
    await db.Loan.create({
      amount: 1000,
      status: 'pending',
      date: new Date(),
      UserId: user.id
    });

    await db.Loan.create({
      amount: 500,
      status: 'approved',
      date: new Date(),
      UserId: leader.id
    });

    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await db.sequelize.close();
  }
}

seed();