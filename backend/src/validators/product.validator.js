const { body, param } = require("express-validator");

// Create product
const validateCreateProduct = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("Product name must be between 2 and 255 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a valid positive number"),

  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),

  body("imageUrl")
    .optional({ nullable: true })
    .trim()
    .isURL()
    .withMessage("Image URL must be a valid URL"),

  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

// Update product
const validateUpdateProduct = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("Product name must be between 2 and 255 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a valid positive number"),

  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),

  body("imageUrl")
    .optional({ nullable: true })
    .trim()
    .isURL()
    .withMessage("Image URL must be a valid URL"),

  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

// Product ID
const validateProductId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer"),
];

// Category ID
const validateProductCategory = [
  param("categoryId")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateProductCategory,
};