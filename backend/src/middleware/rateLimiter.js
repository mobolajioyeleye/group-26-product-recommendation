const rateLimit = require("express-rate-limit");
const ApiError = require("../utils/ApiError");

/**
 * Rate Limiter for Authentication Endpoints (/users/login, /users/register)
 * Protects against brute-force credential stuffing and enumeration attacks.
 *
 * Limits:
 * - Production: 10 attempts per 15 minutes
 * - Test: 5 attempts per 15 minutes
 * - Development: 1000 attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:
    process.env.NODE_ENV === "production"
      ? 10
      : process.env.NODE_ENV === "test"
        ? 5
        : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        "Too many authentication attempts, please try again after 15 minutes"
      )
    );
  },
});

/**
 * General API Rate Limiter
 * Mitigates denial-of-service and aggressive scraping attempts across the API.
 *
 * Limits:
 * - Test: 1000 requests per 15 minutes
 * - Development/Production: 300 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 1000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        "Too many requests from this IP, please try again later"
      )
    );
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
