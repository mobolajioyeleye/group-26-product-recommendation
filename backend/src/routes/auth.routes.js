const express = require("express");

const router = express.Router();

const validateRequest = require("../middleware/validation.middleware");

const {
  validateRegistration,
  validateLogin,
} = require("../validators/auth.validator");

const authController = require("../controllers/auth.controller");

// Register
router.post(
  "/register",
  validateRegistration,
  validateRequest,
  authController.register
);

// Login
router.post(
  "/login",
  validateLogin,
  validateRequest,
  authController.login
);

module.exports = router;