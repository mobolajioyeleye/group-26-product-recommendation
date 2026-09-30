const favouriteModel = require("../models/favourite.model");
const activityModel = require("../models/activity.model");
const productModel = require("../models/product.model");
const categoryModel = require("../models/category.model");
const ApiError = require("../utils/ApiError");

/**
 * Adds a product to the user's favourites.
 * Enforces duplicate checks and automatically records a 'FAVOURITE' event in the activities table.
 *
 * @param {string} userId - UUID of the authenticated user
 * @param {string} productId - UUID of the product to favourite
 * @returns {Promise<Object>} Created favourite record
 */
const addFavourite = async (userId, productId) => {
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Validate product existence
  const product = await productModel.getProductById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Check if already in favourites
  const existingFavourite = await favouriteModel.getFavouriteByUserAndProduct(
    userId,
    productId
  );
  if (existingFavourite) {
    throw new ApiError(409, "Product is already in your favourites");
  }

  // Store in favourites table
  const favourite = await favouriteModel.createFavourite(userId, productId);

  // Record FAVOURITE activity for recommendation engine ingestion
  await activityModel.createActivity(userId, productId, "FAVOURITE");

  return favourite;
};

/**
 * Removes a product from the user's favourites.
 * Historical activity logs in the activities table are preserved for recommendation calculation.
 *
 * @param {string} userId - UUID of the authenticated user
 * @param {string} productId - UUID of the product to unfavourite
 * @returns {Promise<{ product_id: string }>} Deleted favourite info
 */
const removeFavourite = async (userId, productId) => {
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Check if favourite exists
  const existing = await favouriteModel.getFavouriteByUserAndProduct(
    userId,
    productId
  );
  if (!existing) {
    throw new ApiError(404, "Favourite record not found");
  }

  // Delete from favourites
  await favouriteModel.deleteFavourite(userId, productId);

  return { product_id: productId };
};

/**
 * Retrieves the authenticated user's favourited products, enriched with complete product details.
 *
 * @param {string} userId - UUID of the authenticated user
 * @param {Object} [options]
 * @param {number} [options.limit] - Optional result limit
 * @returns {Promise<{ favourites: Array<Object>, total: number }>}
 */
const getUserFavourites = async (userId, options = {}) => {
  let favourites = await favouriteModel.getFavouritesByUser(userId);
  const total = favourites.length;

  const limit = parseInt(options.limit, 10);
  if (Number.isInteger(limit) && limit > 0) {
    favourites = favourites.slice(0, limit);
  }

  // Fetch category mapping for enrichment
  const categories = await categoryModel.getAllCategories();
  const categoryMap = new Map();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat.name);
  }

  // Enrich each favourite with full product data
  const enrichedFavourites = [];
  for (const fav of favourites) {
    const product = await productModel.getProductById(fav.product_id);
    if (product) {
      enrichedFavourites.push({
        product_id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        stock: product.stock,
        category_id: product.category_id,
        category_name: categoryMap.get(product.category_id) || null,
        favourited_at: fav.created_at,
      });
    }
  }

  return {
    favourites: enrichedFavourites,
    total,
  };
};

module.exports = {
  addFavourite,
  removeFavourite,
  getUserFavourites,
};
