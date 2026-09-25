const { param } = require("express-validator");

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
  userIdValidator,
  productFavouriteValidator,
  productIdFavouriteValidator,
};