const { param } = require("express-validator");

const validateFavourite = [
  param("userId")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),

  param("productId")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer"),
];

const validateFavouriteUser = [
  param("userId")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),
];

const validateFavouriteProduct = [
  param("productId")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer"),
];

module.exports = {
  validateFavourite,
  validateFavouriteUser,
  validateFavouriteProduct,
};