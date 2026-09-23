const {
  getAllUsers,
  getUserById,
  findUserByEmail,
} = require("../src/models/user.model");

const pool = require("../src/config/database");

const testUserModel = async () => {
  try {
    console.log("\nTesting getAllUsers...");
    const users = await getAllUsers();
    console.log(`Users found: ${users.length}`);

    console.log("\nTesting getUserById...");
    const user = await getUserById(users[0].id);
    console.log(user);

    console.log("\nTesting findUserByEmail...");
    const userByEmail = await findUserByEmail(users[0].email);
    console.log(userByEmail);

    console.log("\nUser model tests passed.");
  } catch (error) {
    console.error("\nUser model test failed:", error.message);
  } finally {
    await pool.end();
  }
};

testUserModel();