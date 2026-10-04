const { body } = require("express-validator");

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const recordViewValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .matches(uuidRegex)
    .withMessage("Must be a valid UUID"),
];

module.exports = {
  recordViewValidator,
};