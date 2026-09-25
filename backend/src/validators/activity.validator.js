const { body, param } = require("express-validator");

const allowedActivityTypes = [
  "VIEW",
  "FAVOURITE",
  "UNFAVOURITE",
];

const validateCreateActivity = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),

  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer"),

  body("activityType")
    .trim()
    .notEmpty()
    .withMessage("Activity type is required")
    .isIn(allowedActivityTypes)
    .withMessage(
      `Activity type must be one of: ${allowedActivityTypes.join(", ")}`
    ),
];

const validateActivityId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Activity ID must be a positive integer"),
];

const validateActivitiesByUser = [
  param("userId")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),
];

const validateActivitiesByProduct = [
  param("productId")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer"),
];

const validateUserProductActivities = [
  param("userId")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),

  param("productId")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer"),
];

module.exports = {
  validateCreateActivity,
  validateActivityId,
  validateActivitiesByUser,
  validateActivitiesByProduct,
  validateUserProductActivities,
};