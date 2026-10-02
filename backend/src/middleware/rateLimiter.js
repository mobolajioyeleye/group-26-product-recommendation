const rateLimit = require("express-rate-limit");
const ApiError = require("../utils/ApiError");

/**
 * Rate Limiter for Authentication Endpoints (/users/login, /users/register)
 * Protects against brute-force credential stuffing and enumeration attacks.
 * In test environment, limit is elevated so test suites run smoothly.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === "test" ? 100 : 10, // 10 attempts in prod, 100 in test
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, "Too many authentication attempts, please try again after 15 minutes"));
  },
});

/**
 * General API Rate Limiter
 * Mitigates denial-of-service and aggressive scraping attempts across the API.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 1000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, "Too many requests from this IP, please try again later"));
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
