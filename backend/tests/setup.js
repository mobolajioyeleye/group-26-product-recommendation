const path = require("path");
process.env.DOTENV_CONFIG_QUIET = "true";
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
const pool = require("../src/config/database");

afterAll(async () => {
  // Ensure database pool is drained cleanly after tests
  try {
    if (pool && !pool.ending) {
      await pool.end();
    }
  } catch (error) {
    // ignore clean pool teardown errors
  }
});
