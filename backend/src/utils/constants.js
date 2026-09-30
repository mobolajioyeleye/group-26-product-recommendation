/**
 * Activity types supported by the system.
 */
const ACTIVITY_TYPES = {
  VIEW: "VIEW",
  FAVOURITE: "FAVOURITE",
};

/**
 * Recommendation engine scoring and pagination constants.
 */
const RECOMMENDATION_CONFIG = {
  VIEW_WEIGHT: 1,
  FAVOURITE_WEIGHT: 3,
  DEFAULT_LIMIT: 8,
  MAX_LIMIT: 20,
};

module.exports = {
  ACTIVITY_TYPES,
  RECOMMENDATION_CONFIG,
};
