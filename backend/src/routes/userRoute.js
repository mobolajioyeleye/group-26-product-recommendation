const express = require("express");

const {
  login,
  logout,
  create,
  getAll,
  getOne,
  update,
  updatePassword,
  remove,
} = require("../controllers/userController");


const { authenticate } = require("../middleware/authMiddleware"); 
const { authorize } = require("../middleware/roleMiddleware");
const validate = require("../middleware/validate");
const { validateUUIDParam } = require("../validators/common.validator");
const { registerValidator, loginValidator } = require("../validators/auth.validator");
const {
  updateUserValidator,
  updatePasswordValidator,
} = require("../validators/user.validator");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

//public route
//register user (rate-limited against brute-force account creation)
router.post("/register", authLimiter, registerValidator, validate, create);
//login (rate-limited against brute-force credential stuffing)
router.post("/login", authLimiter, loginValidator, validate, login);
//logout
router.post("/logout", logout);

//protected routes

// Get all users
router.get("/",authenticate, authorize("Administrator"), getAll);

// Get user by ID
router.get("/:id", authenticate, validateUUIDParam(), validate, getOne);

// Update user
router.put(
  "/:id",
  authenticate,
  authorize("Administrator"),
  validateUUIDParam(),
  updateUserValidator,
  validate,
  update
);

// Update password
router.patch(
  "/:id/password",
  authenticate,
  validateUUIDParam(),
  updatePasswordValidator,
  validate,
  updatePassword
);

// Delete user
router.delete(
  "/:id",
  authenticate,
  authorize("Administrator"),
  validateUUIDParam(),
  validate,
  remove
);

module.exports = router;
