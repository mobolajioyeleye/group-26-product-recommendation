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
} = require("../controller/userController");


const { authenticate } = require("../middleware/authMiddleware"); 
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

//public route
//register user
router.post("/register", create);
//login
router.post("/login", login); 
//logout
router.post("/logout", logout);

//protected routes

// Get all users
router.get("/",authenticate, authorize("Administrator", "super_admin"), getAll);

// Get user by ID
router.get("/:id",authenticate, getOne);

// Update user
router.put("/:id",authenticate,authorize("Administrator", "super_admin"), update);

// Update password
router.patch("/:id/password", authenticate, updatePassword);

// Delete user
router.delete("/:id",authenticate, authorize("Administrator", "super_admin"), remove);

module.exports = router;
