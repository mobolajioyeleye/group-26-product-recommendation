const pool = require("../config/database");

const createFavourite = async (userId, productId) => {
  const result = await pool.query(
    `INSERT INTO favourites (user_id, product_id)
     VALUES ($1, $2)
     RETURNING user_id, product_id, created_at`,
    [userId, productId]
  );

  return result.rows[0];
};

const getAllFavourites = async () => {
  const result = await pool.query(
    `SELECT user_id, product_id, created_at
     FROM favourites
     ORDER BY created_at DESC`
  );

  return result.rows;
};

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