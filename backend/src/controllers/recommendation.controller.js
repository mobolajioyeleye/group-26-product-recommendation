const recommendationService = require("../services/recommendation.service");

/**
 * Controller to handle recommendation requests.
 * Extracts authenticated user ID from req.user (when auth middleware is present)
 * or optional userId from query parameters for unauthenticated testing / guest mode.
 *
 * @route GET /api/recommendations
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.query.userId || null;
    const limit = req.query.limit;

    const result = await recommendationService.getRecommendationsForUser(userId, {
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.recommendations,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
};
