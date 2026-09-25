const express = require("express");

const router = express.Router();

const {
  registerValidator,
  loginValidator,
} = require("../validators/auth.validator");

const validateRequest = require("../middleware/validation.middleware");

const authController = require("../controllers/auth.controller");

// Register
router.post(
  "/register",
  registerValidator,
  validateRequest,
  authController.register
);

// Login
router.post(
  "/login",
  loginValidator,
  validateRequest,
  authController.login
);

module.exports = router;