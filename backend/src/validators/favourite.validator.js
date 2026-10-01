const { body, param } = require("express-validator");

const addFavouriteValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isUUID()
    .withMessage("Must be a valid UUID"),
];

const userIdValidator = [
  param("userId")
    .isUUID()
    .withMessage("User ID must be a valid UUID"),
];

const productFavouriteValidator = [
  param("userId")
    .isUUID()
    .withMessage("User ID must be a valid UUID"),

  param("productId")
    .isUUID()
    .withMessage("Product ID must be a valid UUID"),
];

const productIdFavouriteValidator = [
  param("productId")
    .isUUID()
    .withMessage("Product ID must be a valid UUID"),
];

module.exports = {
  addFavouriteValidator,
  userIdValidator,
  productFavouriteValidator,
  productIdFavouriteValidator,
};