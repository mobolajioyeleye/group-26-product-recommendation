const bcrypt = require("bcryptjs");

const {
  createUser,
  getAllUsers,
  getUserById,
  findUserByEmail,
  updateUser,
  updateUserPassword,
  deleteUser,
} = require("../models/user.model");

// Authentication & Error utilities
const { generateAccessToken } = require("../utils/auth");
const ApiError = require("../utils/ApiError");

// Create user
const create = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(ApiError.badRequest("Name, email and password are required"));
    }
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return next(ApiError.conflict("Email already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser(name, email, hashedPassword, "User");

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Get all users
const getAll = async (req, res, next) => {
  try {
    const users = await getAllUsers();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(ApiError.badRequest("Email and password are required"));
    }
    const user = await findUserByEmail(email);
    if (!user) {
      return next(ApiError.unauthorized("Invalid email or password"));
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return next(ApiError.unauthorized("Invalid email or password"));
    }
    const token = generateAccessToken(user);
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id && req.user.role !== "Administrator") {
      return next(
        ApiError.forbidden("You are not authorized to view this user")
      );
    }

    const user = await getUserById(id);

    if (!user) {
      return next(ApiError.notFound("User not found"));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Update user
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return next(ApiError.badRequest("Name, email and role are required"));
    }

    const user = await updateUser(id, name, email, role);

    if (!user) {
      return next(ApiError.notFound("User not found"));
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Update password
const updatePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return next(ApiError.badRequest("Password is required"));
    }
    // Only the account owner or an Administrator can change the password
    if (req.user.id !== id && req.user.role !== "Administrator") {
      return next(
        ApiError.forbidden("You are not authorized to change this user's password")
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await updateUserPassword(id, hashedPassword);

    if (!user) {
      return next(ApiError.notFound("User not found"));
    }

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await deleteUser(id);

    if (!user) {
      return next(ApiError.notFound("User not found"));
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  create,
  getAll,
  getOne,
  update,
  updatePassword,
  remove,
};
