const pool = require("../config/database");

// Add a product to a user's favourites
const createFavourite = async (userId, productId) => {
  const result = await pool.query(
    `INSERT INTO favourites (user_id, product_id)
     VALUES ($1, $2)
     RETURNING user_id, product_id, created_at`,
    [userId, productId]
  );

  return result.rows[0];
};

// Retrieve all favourite records ordered by creation date
const getAllFavourites = async () => {
  const result = await pool.query(
    `SELECT user_id, product_id, created_at
     FROM favourites
     ORDER BY created_at DESC`
  );

  return result.rows;
};

// Check or retrieve a favourite record by user ID and product ID
const getFavouriteByUserAndProduct = async (userId, productId) => {
  const result = await pool.query(
    `SELECT user_id, product_id, created_at
     FROM favourites
     WHERE user_id = $1
       AND product_id = $2`,
    [userId, productId]
  );

  return result.rows[0];
};

// Retrieve all favourites for a specific user
const getFavouritesByUser = async (userId) => {
  const result = await pool.query(
    `SELECT user_id, product_id, created_at
     FROM favourites
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

// Retrieve all favourite entries for a specific product
const getFavouritesByProduct = async (productId) => {
  const result = await pool.query(
    `SELECT user_id, product_id, created_at
     FROM favourites
     WHERE product_id = $1
     ORDER BY created_at DESC`,
    [productId]
  );

  return result.rows;
};

// Remove a product from a user's favourites
const deleteFavourite = async (userId, productId) => {
  const result = await pool.query(
    `DELETE FROM favourites
     WHERE user_id = $1
       AND product_id = $2
     RETURNING user_id, product_id`,
    [userId, productId]
  );

  return result.rows[0];
};

module.exports = {
  createFavourite,
  getAllFavourites,
  getFavouriteByUserAndProduct,
  getFavouritesByUser,
  getFavouritesByProduct,
  deleteFavourite,
};