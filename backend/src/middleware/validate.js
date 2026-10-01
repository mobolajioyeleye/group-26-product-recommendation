const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstErrorMessage = errors.array()[0].msg;
    return next(ApiError.badRequest(firstErrorMessage));
  }

  next();
};

module.exports = validate;
