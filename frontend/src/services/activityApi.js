import { apiRequest } from "./api.js";
import { isUUID, resolveProductId } from "./favouritesApi.js";

/**
 * Record a product view activity for the authenticated user.
 * Required by PRD FR-14 to feed the recommendation engine.
 *
 * @param {string} productId - Product UUID or slug
 * @returns {Promise<Object|null>} Activity record or null if not recordable
 */
export const recordProductView = async (productId) => {
  const targetId = resolveProductId(productId);
  if (!isUUID(targetId)) {
    return null;
  }

  try {
    const response = await apiRequest("/api/activities/view", {
      method: "POST",
      body: JSON.stringify({ productId: targetId }),
    });
    return response?.data || null;
  } catch (error) {
    // Activity tracking should not break the user experience if it fails
    console.warn("[Activity Tracker] Could not record product view:", error.message);
    return null;
  }
};

/**
 * Fetch the authenticated user's activity stream.
 *
 * @param {Object} [params] - Query parameters { limit, type }
 * @returns {Promise<Array>} List of user activities
 */
export const getUserActivities = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", params.limit);
  if (params.type) query.set("type", params.type);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const response = await apiRequest(`/api/activities${queryString}`, {
    method: "GET",
  });
  return response?.data || [];
};
