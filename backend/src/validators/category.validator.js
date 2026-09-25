const { body, param } = require("express-validator");

// Create category
const validateCreateCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
];

// Update category
const validateUpdateCategory = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
];

// Category ID
const validateCategoryId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
];

module.exports = {
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryId,
};