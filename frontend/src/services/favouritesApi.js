import { apiRequest } from "./api.js";

/**
 * UUID v4 validator to prevent invalid identifier formats
 * from hitting backend endpoints and triggering 400 Bad Request.
 */
export const isUUID = (id) => {
  if (typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Retrieve all favourite products for the authenticated user.
 * @returns {Promise<Array>} Array of favourite items with product details
 */
export const getFavourites = async () => {
  const response = await apiRequest("/api/favourites", {
    method: "GET",
  });
  return response?.data || [];
};

/**
 * Add a product to the user's favourites list.
 * @param {string} productId - Product UUID
 * @returns {Promise<Object>} Added favourite record
 */
export const addFavourite = async (productId) => {
  if (!isUUID(productId)) {
    // Return mock success for local mock IDs to preserve offline/preview experience
    return { product_id: productId, offline: true };
  }

  const response = await apiRequest("/api/favourites", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
  return response?.data;
};

/**
 * Remove a product from the user's favourites list.
 * @param {string} productId - Product UUID
 * @returns {Promise<Object>} Result confirmation
 */
export const removeFavourite = async (productId) => {
  if (!isUUID(productId)) {
    return { product_id: productId, offline: true };
  }

  const response = await apiRequest(`/api/favourites/${productId}`, {
    method: "DELETE",
  });
  return response?.data;
};
