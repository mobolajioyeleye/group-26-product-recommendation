const { verifyAccessToken } = require("../utils/auth");
const ApiError = require("../utils/ApiError");

const authenticate = (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    const decoded = verifyAccessToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  authenticate,
};
