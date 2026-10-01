const { query } = require("express-validator");

const recommendationQueryValidator = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("Limit must be between 1 and 20"),
];

module.exports = {
  recommendationQueryValidator,
};
