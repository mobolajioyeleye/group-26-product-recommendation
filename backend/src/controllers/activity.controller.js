const activityService = require("../services/activity.service");

/**
 * Controller to record a product view for the authenticated user.
 *
 * @route POST /api/activities/view
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const recordView = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const activity = await activityService.recordView(userId, productId);

    res.status(201).json({
      success: true,
      message: "Product view recorded successfully",
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve activity history for the authenticated user.
 *
 * @route GET /api/activities
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const getUserActivities = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit, type } = req.query;

    const result = await activityService.getUserActivities(userId, {
      limit,
      type,
    });

    res.status(200).json({
      success: true,
      data: result.activities,
      meta: {
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordView,
  getUserActivities,
};
