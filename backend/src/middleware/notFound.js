const ApiError = require("../utils/ApiError");

const notFound = (req, res, next) => {
  const error = new ApiError(
    404,
    `Route not found: ${req.method} ${req.originalUrl}`
  );

  next(error);
};

module.exports = notFound;
