/**
 * Environment Configuration & Security Validator
 * Validates critical environment variables to prevent silent startup failures or insecure fallbacks.
 */
require("dotenv").config();

const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];

function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const errorMsg = `[CRITICAL SECURITY ERROR] Missing required environment variables: ${missing.join(", ")}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(errorMsg);
    } else {
      console.warn(errorMsg);
    }
  }
}

// Allowed CORS origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [
      "http://localhost:5173", // Local Vite frontend dev
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL,
    ].filter(Boolean);

module.exports = {
  validateEnv,
  allowedOrigins,
};
