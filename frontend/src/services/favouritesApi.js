import { apiRequest } from "./api.js";

/**
 * UUID v4 validator to prevent invalid identifier formats
 * from hitting backend endpoints and triggering 400 Bad Request.
 */
export const isUUID = (id) => {
  if (typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const SLUG_TO_UUID = {
  earbuds: "20000000-0000-0000-0000-000000000100",
  "smart-watch": "20000000-0000-0000-0000-000000000106",
  "laptop-sleeve": "20000000-0000-0000-0000-000000000078",
  backpack: "20000000-0000-0000-0000-000000000175",
  headphones: "20000000-0000-0000-0000-000000000066",
  camera: "20000000-0000-0000-0000-000000000045",
  sneakers: "20000000-0000-0000-0000-000000000088",
  speaker: "20000000-0000-0000-0000-000000000061",
  "ceramic-vase": "20000000-0000-0000-0000-000000000047",
  "face-care": "20000000-0000-0000-0000-000000000004",
  "yoga-mat": "20000000-0000-0000-0000-000000000090",
};

export const UUID_TO_SLUG = Object.entries(SLUG_TO_UUID).reduce(
  (acc, [slug, uuid]) => {
    acc[uuid] = slug;
    return acc;
  },
  {}
);

/**
 * Resolves a product ID (slug or UUID) to a valid backend UUID.
 */
export const resolveProductId = (id) => {
  if (!id) return id;
  if (isUUID(id)) return id;
  return SLUG_TO_UUID[id] || id;
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
 * @param {string} productId - Product UUID or slug
 * @returns {Promise<Object>} Added favourite record
 */
export const addFavourite = async (productId) => {
  const targetId = resolveProductId(productId);
  if (!isUUID(targetId)) {
    return { product_id: productId, offline: true };
  }

  try {
    const response = await apiRequest("/api/favourites", {
      method: "POST",
      body: JSON.stringify({ productId: targetId }),
    });
    return response?.data;
  } catch (error) {
    // If backend rejects prototype/seed mock UUID format or product is not in database yet,
    // gracefully retain favorite locally without showing an error to the user
    if (
      error?.message?.toLowerCase().includes("uuid") ||
      error?.message?.toLowerCase().includes("not found") ||
      error?.response?.status === 400 ||
      error?.response?.status === 404
    ) {
      console.warn(
        `[Favourites] Backend sync fallback for ${targetId}:`,
        error.message
      );
      return { product_id: productId, offline: true };
    }
    throw error;
  }
};

/**
 * Remove a product from the user's favourites list.
 * @param {string} productId - Product UUID or slug
 * @returns {Promise<Object>} Result confirmation
 */
export const removeFavourite = async (productId) => {
  const targetId = resolveProductId(productId);
  if (!isUUID(targetId)) {
    return { product_id: productId, offline: true };
  }

  try {
    const response = await apiRequest(`/api/favourites/${targetId}`, {
      method: "DELETE",
    });
    return response?.data;
  } catch (error) {
    // If backend rejects non-standard ID or favourite is not found on backend,
    // gracefully succeed locally
    if (
      error?.message?.toLowerCase().includes("uuid") ||
      error?.message?.toLowerCase().includes("not found") ||
      error?.response?.status === 400 ||
      error?.response?.status === 404
    ) {
      console.warn(
        `[Favourites] Backend remove fallback for ${targetId}:`,
        error.message
      );
      return { product_id: productId, offline: true };
    }
    throw error;
  }
};

