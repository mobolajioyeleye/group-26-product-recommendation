const { param, query } = require("express-validator");

// UUID parameter
const validateUUIDParam = (field = "id") => {
  return param(field)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`);
};

// UUID query parameter
const validateUUIDQuery = (field) => {
  return query(field)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`);
};

module.exports = {
  validateUUIDParam,
  validateUUIDQuery,
};