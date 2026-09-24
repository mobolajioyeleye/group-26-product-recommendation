const fs = require("fs");
const path = require("path");
const pool = require("../src/config/database");

async function seedDatabase() {
  const seedPath = path.join(
    __dirname,
    "../../database/seeds/001_initial_data.sql"
  );

  const sql = fs.readFileSync(seedPath, "utf8");

  try {
    await pool.query(sql);
    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Database seeding failed:", error.message);
  } finally {
    await pool.end();
  }
}

seedDatabase();