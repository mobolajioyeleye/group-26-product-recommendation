const { body, param } = require("express-validator");

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const addFavouriteValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .matches(uuidRegex)
    .withMessage("Must be a valid UUID"),
];

const userIdValidator = [
  param("userId")
    .matches(uuidRegex)
    .withMessage("User ID must be a valid UUID"),
];

const productFavouriteValidator = [
  param("userId")
    .matches(uuidRegex)
    .withMessage("User ID must be a valid UUID"),

  param("productId")
    .matches(uuidRegex)
    .withMessage("Product ID must be a valid UUID"),
];

const productIdFavouriteValidator = [
  param("productId")
    .matches(uuidRegex)
    .withMessage("Product ID must be a valid UUID"),
];

module.exports = {
  addFavouriteValidator,
  userIdValidator,
  productFavouriteValidator,
  productIdFavouriteValidator,
};