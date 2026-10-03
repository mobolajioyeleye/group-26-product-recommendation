import { apiRequest } from "./api.js";

/**
 * Normalizes backend recommendation items into consistent frontend product objects.
 * Maps category_name, image_url, and recommendation_reason into standard fields.
 *
 * @param {Array<Object>} rawProducts - Products returned by GET /api/recommendations
 * @returns {Array<Object>} Normalized product items ready for UI grids and carousels
 */
export const normalizeRecommendations = (rawProducts = []) => {
  if (!Array.isArray(rawProducts)) return [];

  return rawProducts.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || "",
    price: Number(item.price) || 0,
    category: item.category_name || item.category || "Uncategorized",
    image: item.image_url || item.image || "",
    stock: Number(item.stock) || 0,
    rating: Number(item.rating) || 4.8,
    reviews: Number(item.reviews_count || item.reviews) || 24,
    recommendationReason: item.recommendation_reason || "Recommended for you",
  }));
};

/**
 * Fetch recommendations from the backend recommendation engine (GET /api/recommendations).
 * Supports authenticated personalized recommendations as well as unauthenticated
 * cold-start starter recommendations.
 *
 * @param {Object} [options]
 * @param {number} [options.limit=10] - Maximum number of recommendations to return (1-20)
 * @returns {Promise<{ recommendations: Array<Object>, meta: Object }>}
 */
export const getRecommendations = async (options = {}) => {
  const limit = options.limit || 10;
  const queryString = `?limit=${encodeURIComponent(limit)}`;

  const response = await apiRequest(`/api/recommendations${queryString}`, {
    method: "GET",
  });

  const rawData = response?.data || [];
  const meta = response?.meta || {
    total: rawData.length,
    count: rawData.length,
    personalized: false,
  };

  return {
    recommendations: normalizeRecommendations(rawData),
    meta,
  };
};
