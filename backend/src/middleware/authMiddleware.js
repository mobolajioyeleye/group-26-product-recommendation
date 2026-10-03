const { verifyAccessToken } = require("../utils/auth");
const ApiError = require("../utils/ApiError");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;
    const token = req.cookies?.accessToken || bearerToken;

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
