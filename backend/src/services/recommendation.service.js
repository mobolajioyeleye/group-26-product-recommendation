const activityModel = require("../models/activity.model");
const favouriteModel = require("../models/favourite.model");
const productModel = require("../models/product.model");
const categoryModel = require("../models/category.model");
const { RECOMMENDATION_CONFIG, ACTIVITY_TYPES } = require("../utils/constants");

/**
 * Helper to fetch a mapping of category ID to category details.
 *
 * @returns {Promise<Map<string, Object>>}
 */
const getCategoryMap = async () => {
  const categories = await categoryModel.getAllCategories();
  const categoryMap = new Map();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat);
  }
  return categoryMap;
};

/**
 * Helper to get cold-start (default/general) recommendations for users without activity.
 *
 * @param {number} limit
 * @returns {Promise<Array<Object>>}
 */
const getColdStartRecommendations = async (limit) => {
  const allProducts = await productModel.getAllProducts();
  const categoryMap = await getCategoryMap();

  return allProducts.slice(0, limit).map((product) => ({
    ...product,
    recommendation_reason: "Popular discovery pick",
    category_name: categoryMap.get(product.category_id)?.name || null,
  }));
};

/**
 * Calculates interest scores per category based on user activities and favourites.
 * Favourites are weighted more heavily than views, and repeated interactions accumulate.
 *
 * @param {Array<Object>} activities - User activity history
 * @param {Array<Object>} favourites - Current user favourites
 * @param {Map<string, Object>} productCache - Cached product data by ID
 * @returns {Array<{ categoryId: string, score: number }>}
 */
const calculateCategoryScores = (activities, favourites, productCache) => {
  const categoryScores = new Map();

  // Score activities (VIEW and FAVOURITE events)
  for (const activity of activities) {
    const product = productCache.get(activity.product_id);
    if (!product || !product.category_id) continue;

    const weight =
      activity.activity_type === ACTIVITY_TYPES.FAVOURITE
        ? RECOMMENDATION_CONFIG.FAVOURITE_WEIGHT
        : RECOMMENDATION_CONFIG.VIEW_WEIGHT;

    const currentScore = categoryScores.get(product.category_id) || 0;
    categoryScores.set(product.category_id, currentScore + weight);
  }

  // Also account for active favourites that might not have an activity record
  for (const fav of favourites) {
    const product = productCache.get(fav.product_id);
    if (!product || !product.category_id) continue;

    // Check if this favourite was already counted in activities
    const hasActivity = activities.some(
      (a) =>
        a.product_id === fav.product_id &&
        a.activity_type === ACTIVITY_TYPES.FAVOURITE
    );

    if (!hasActivity) {
      const currentScore = categoryScores.get(product.category_id) || 0;
      categoryScores.set(
        product.category_id,
        currentScore + RECOMMENDATION_CONFIG.FAVOURITE_WEIGHT
      );
    }
  }

  // Convert to sorted array (highest score first)
  return Array.from(categoryScores.entries())
    .map(([categoryId, score]) => ({ categoryId, score }))
    .sort((a, b) => b.score - a.score);
};

/**
 * Main recommendation generator for a user.
 *
 * Rules:
 * 1. Analyzes category interests based on views and favourites.
 * 2. Weights favourites more heavily than views.
 * 3. Rewards repeated interaction in categories.
 * 4. Excludes previously interacted products when alternatives exist.
 * 5. Provides graceful cold-start for new users without activity.
 * 6. Falls back to other categories or general products if preferred category is exhausted.
 *
 * @param {string|null} userId - User ID (UUID)
 * @param {Object} [options]
 * @param {number} [options.limit=8] - Maximum number of recommendations
 * @returns {Promise<{ recommendations: Array<Object>, meta: Object }>}
 */
const getRecommendationsForUser = async (userId, options = {}) => {
  const requestedLimit = parseInt(options.limit, 10);
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, RECOMMENDATION_CONFIG.MAX_LIMIT)
      : RECOMMENDATION_CONFIG.DEFAULT_LIMIT;

  // Cold start rule: if no userId is provided, return default recommendations
  if (!userId) {
    const defaultProducts = await getColdStartRecommendations(limit);
    return {
      recommendations: defaultProducts,
      meta: {
        total: defaultProducts.length,
        count: defaultProducts.length,
        personalized: false,
        reason: "unauthenticated_cold_start",
      },
    };
  }

  // Fetch user interaction data
  const [activities, favourites, categoryMap] = await Promise.all([
    activityModel.getActivitiesByUser(userId),
    favouriteModel.getFavouritesByUser(userId),
    getCategoryMap(),
  ]);

  // Cold start rule: user exists but has zero recorded activities and favourites
  if (activities.length === 0 && favourites.length === 0) {
    const defaultProducts = await getColdStartRecommendations(limit);
    return {
      recommendations: defaultProducts,
      meta: {
        total: defaultProducts.length,
        count: defaultProducts.length,
        personalized: false,
        reason: "no_activity_cold_start",
      },
    };
  }

  // Collect set of unique interacted product IDs to exclude
  const interactedProductIds = new Set();
  const uniqueProductIdsToFetch = new Set();

  for (const activity of activities) {
    interactedProductIds.add(activity.product_id);
    uniqueProductIdsToFetch.add(activity.product_id);
  }

  for (const fav of favourites) {
    interactedProductIds.add(fav.product_id);
    uniqueProductIdsToFetch.add(fav.product_id);
  }

  // Preload product details for interacted products to resolve category IDs
  const productCache = new Map();
  await Promise.all(
    Array.from(uniqueProductIdsToFetch).map(async (productId) => {
      const product = await productModel.getProductById(productId);
      if (product) {
        productCache.set(productId, product);
      }
    })
  );

  // Score categories based on interaction rules
  const rankedCategories = calculateCategoryScores(
    activities,
    favourites,
    productCache
  );

  const recommendations = [];
  const addedProductIds = new Set();

  // Retrieve candidate products from top categories in order of interest
  for (const { categoryId, score } of rankedCategories) {
    if (recommendations.length >= limit) break;

    const categoryProducts = await productModel.getProductsByCategory(categoryId);
    const categoryName = categoryMap.get(categoryId)?.name || "your interests";

    for (const product of categoryProducts) {
      if (recommendations.length >= limit) break;

      // Exclude previously interacted products and duplicates
      if (
        !interactedProductIds.has(product.id) &&
        !addedProductIds.has(product.id)
      ) {
        recommendations.push({
          ...product,
          category_name: categoryMap.get(product.category_id)?.name || null,
          recommendation_reason: `Based on your interest in ${categoryName}`,
        });
        addedProductIds.add(product.id);
      }
    }
  }

  // Fallback 1: If preferred categories did not yield enough alternatives, backfill from other categories
  if (recommendations.length < limit) {
    const allProducts = await productModel.getAllProducts();

    for (const product of allProducts) {
      if (recommendations.length >= limit) break;

      if (
        !interactedProductIds.has(product.id) &&
        !addedProductIds.has(product.id)
      ) {
        recommendations.push({
          ...product,
          category_name: categoryMap.get(product.category_id)?.name || null,
          recommendation_reason: "Recommended alternative",
        });
        addedProductIds.add(product.id);
      }
    }
  }

  // Fallback 2: If the user has interacted with almost all products in the catalog,
  // relax view exclusion while keeping active favourites excluded
  if (recommendations.length < limit) {
    const activeFavouriteIds = new Set(favourites.map((f) => f.product_id));
    const allProducts = await productModel.getAllProducts();

    for (const product of allProducts) {
      if (recommendations.length >= limit) break;

      if (!activeFavouriteIds.has(product.id) && !addedProductIds.has(product.id)) {
        recommendations.push({
          ...product,
          category_name: categoryMap.get(product.category_id)?.name || null,
          recommendation_reason: "Revisit items you explored",
        });
        addedProductIds.add(product.id);
      }
    }
  }

  return {
    recommendations,
    meta: {
      total: recommendations.length,
      count: recommendations.length,
      personalized: true,
      topCategories: rankedCategories.map((c) => ({
        categoryId: c.categoryId,
        categoryName: categoryMap.get(c.categoryId)?.name || null,
        score: c.score,
      })),
    },
  };
};

module.exports = {
  getRecommendationsForUser,
  getColdStartRecommendations,
  calculateCategoryScores,
};
