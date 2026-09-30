const recommendationService = require("../services/recommendation.service");

/**
 * Controller to handle recommendation requests.
 * Extracts authenticated user ID from req.user (populated by auth middleware)
 * or falls back to null for unauthenticated guest visitors.
 *
 * @route GET /api/recommendations
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
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
