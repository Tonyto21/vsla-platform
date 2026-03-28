const { sequelize, User, Group, Contribution, Loan } = require('./models');

async function seed() {
  try {
    await sequelize.sync({ force: true });

    console.log("Seeding database...");

    // Create Group
    const group = await Group.create({
      name: "Hope VSLA Group",
      description: "Sample savings group"
    });

    // Create Users
    const user1 = await User.create({
      name: "John Doe",
      email: "john@example.com",
      GroupId: group.id
    });

    const user2 = await User.create({
      name: "Mary Jane",
      email: "mary@example.com",
      GroupId: group.id
    });

    // Contributions
    await Contribution.create({
      amount: 50,
      UserId: user1.id
    });

    await Contribution.create({
      amount: 75,
      UserId: user2.id
    });

    // Loans
    await Loan.create({
      amount: 100,
      status: "approved",
      UserId: user1.id
    });

    console.log("Seeding complete ✅");
    process.exit();
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

seed();