const { body, param } = require("express-validator");

const createActivityValidator = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isUUID()
    .withMessage("User ID must be a valid UUID"),

  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isUUID()
    .withMessage("Product ID must be a valid UUID"),

  body("activityType")
    .notEmpty()
    .withMessage("Activity type is required")
    .isIn(["VIEW", "FAVOURITE"])
    .withMessage("Activity type must be either VIEW or FAVOURITE"),
];

const activityIdValidator = [
  param("id")
    .isUUID()
    .withMessage("Activity ID must be a valid UUID"),
];

const activitiesByUserValidator = [
  param("userId")
    .isUUID()
    .withMessage("User ID must be a valid UUID"),
];

const activitiesByProductValidator = [
  param("productId")
    .isUUID()
    .withMessage("Product ID must be a valid UUID"),
];

const userProductActivityValidator = [
  param("userId")
    .isUUID()
    .withMessage("User ID must be a valid UUID"),

  param("productId")
    .isUUID()
    .withMessage("Product ID must be a valid UUID"),
];

module.exports = {
  createActivityValidator,
  activityIdValidator,
  activitiesByUserValidator,
  activitiesByProductValidator,
  userProductActivityValidator,
};