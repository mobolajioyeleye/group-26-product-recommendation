const {
  createUser,
  getUserById,
  findUserByEmail,
  updateUser,
  updateUserPassword,
  deleteUser,
} = require("../src/models/user.model");

const pool = require("../src/config/database");

const testUserModel = async () => {
  let userId;

  try {
    console.log("\nTesting createUser...");
    const newUser = await createUser(
      "Test User",
      "testuser@example.com",
      "test-password-hash"
    );

    userId = newUser.id;
    console.log(newUser);

    console.log("\nTesting getUserById...");
    const user = await getUserById(userId);
    console.log(user);

    console.log("\nTesting findUserByEmail...");
    const userByEmail = await findUserByEmail("testuser@example.com");
    console.log(userByEmail);

    console.log("\nTesting updateUser...");
    const updatedUser = await updateUser(
      userId,
      "Updated Test User",
      "updatedtest@example.com",
      "User"
    );
    console.log(updatedUser);

    console.log("\nTesting updateUserPassword...");
    const passwordUpdatedUser = await updateUserPassword(
      userId,
      "new-test-password-hash"
    );
    console.log(passwordUpdatedUser);

    console.log("\nTesting deleteUser...");
    const deletedUser = await deleteUser(userId);
    console.log(deletedUser);

    console.log("\nAll user model tests passed.");
  } catch (error) {
    console.error("\nUser model test failed:", error.message);
  } finally {
    await pool.end();
  }
};

testUserModel();