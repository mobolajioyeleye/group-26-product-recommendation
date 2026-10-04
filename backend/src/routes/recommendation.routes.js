const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendation.controller");
const { verifyAccessToken } = require("../utils/auth");
const validate = require("../middleware/validate");
const {
  recommendationQueryValidator,
} = require("../validators/recommendation.validator");

/**
 * Optional authentication helper for recommendation engine.
 * Allows unauthenticated guests through with req.user = null,
 * while populating req.user if a valid token is present.
 */
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers && req.headers.authorization;
    const token =
      (req.cookies && req.cookies.accessToken) ||
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }
  next();
};

// GET /api/recommendations (supports authenticated user or guest cold start)
router.get(
  "/",
  recommendationQueryValidator,
  validate,
  optionalAuthenticate,
  recommendationController.getRecommendations
);

module.exports = router;

