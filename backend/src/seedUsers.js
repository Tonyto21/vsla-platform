const { Group, User } = require('./models');

async function seedUsers() {
  try {
    // Create Groups / Roles
    const adminGroup = await Group.create({ name: 'CBL Admin', description: 'Full system admin' });
    const leaderGroup = await Group.create({ name: 'Leader', description: 'Group leader' });
    const userGroup = await Group.create({ name: 'User', description: 'Regular member' });

    // Create Users
    await User.create({ name: 'CBL Admin', email: 'admin@vsla.com', GroupId: adminGroup.id });
    await User.create({ name: 'Leader', email: 'leader@vsla.com', GroupId: leaderGroup.id });
    await User.create({ name: 'User', email: 'user@vsla.com', GroupId: userGroup.id });

    console.log('✅ Users seeded successfully');
    process.exit();
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exit(1);
  }
}

seedUsers();