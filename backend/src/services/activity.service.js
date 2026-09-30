const activityModel = require("../models/activity.model");
const productModel = require("../models/product.model");
const ApiError = require("../utils/ApiError");

/**
 * Records a VIEW activity for a product by an authenticated user.
 * Validates that the product exists before recording.
 *
 * @param {string} userId - UUID of the authenticated user
 * @param {string} productId - UUID of the viewed product
 * @returns {Promise<Object>} Created activity record
 */
const recordView = async (userId, productId) => {
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Validate product existence
  const product = await productModel.getProductById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Record the VIEW activity (repeated views generate distinct timestamps)
  const activity = await activityModel.createActivity(userId, productId, "VIEW");
  return activity;
};

/**
 * Retrieves the activity history for a specific authenticated user.
 * Optionally filters by activityType and limits the number of returned records.
 *
 * @param {string} userId - UUID of the user
 * @param {Object} [options]
 * @param {number} [options.limit] - Maximum number of records to return
 * @param {string} [options.type] - Filter by 'VIEW' or 'FAVOURITE'
 * @returns {Promise<{ activities: Array<Object>, total: number }>}
 */
const getUserActivities = async (userId, options = {}) => {
  let activities = await activityModel.getActivitiesByUser(userId);

  // Optional filter by activity type (VIEW / FAVOURITE)
  if (options.type && ["VIEW", "FAVOURITE"].includes(options.type.toUpperCase())) {
    activities = activities.filter(
      (a) => a.activity_type === options.type.toUpperCase()
    );
  }

  const total = activities.length;

  // Optional pagination limit
  const limit = parseInt(options.limit, 10);
  if (Number.isInteger(limit) && limit > 0) {
    activities = activities.slice(0, limit);
  }

  // Enrich activities with product details for frontend consumption
  const productCache = new Map();
  const enrichedActivities = await Promise.all(
    activities.map(async (activity) => {
      let product = productCache.get(activity.product_id);
      if (!product) {
        product = await productModel.getProductById(activity.product_id);
        if (product) {
          productCache.set(activity.product_id, product);
        }
      }

      return {
        id: activity.id,
        user_id: activity.user_id,
        product_id: activity.product_id,
        product_name: product?.name || null,
        product_image: product?.image_url || null,
        category_id: product?.category_id || null,
        activity_type: activity.activity_type,
        created_at: activity.created_at,
      };
    })
  );

  return {
    activities: enrichedActivities,
    total,
  };
};

module.exports = {
  recordView,
  getUserActivities,
};
