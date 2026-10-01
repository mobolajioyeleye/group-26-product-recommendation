const { body } = require("express-validator");

const recordViewValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isUUID()
    .withMessage("Must be a valid UUID"),
];

module.exports = {
  recordViewValidator,
};