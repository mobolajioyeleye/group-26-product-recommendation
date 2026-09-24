const pool = require("../config/database");

const createActivity = async (userId, productId, activityType) => {
  const result = await pool.query(
    `INSERT INTO activities (user_id, product_id, activity_type)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, product_id, activity_type, created_at`,
    [userId, productId, activityType]
  );

  return result.rows[0];
};

const getAllActivities = async () => {
  const result = await pool.query(
    `SELECT id, user_id, product_id, activity_type, created_at
     FROM activities
     ORDER BY created_at DESC`
  );

  return result.rows;
};

const getActivityById = async (id) => {
  const result = await pool.query(
    `SELECT id, user_id, product_id, activity_type, created_at
     FROM activities
     WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

const getActivitiesByUser = async (userId) => {
  const result = await pool.query(
    `SELECT id, user_id, product_id, activity_type, created_at
     FROM activities
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

const getActivitiesByProduct = async (productId) => {
  const result = await pool.query(
    `SELECT id, user_id, product_id, activity_type, created_at
     FROM activities
     WHERE product_id = $1
     ORDER BY created_at DESC`,
    [productId]
  );

  return result.rows;
};

const getUserProductActivities = async (userId, productId) => {
  const result = await pool.query(
    `SELECT id, user_id, product_id, activity_type, created_at
     FROM activities
     WHERE user_id = $1
       AND product_id = $2
     ORDER BY created_at DESC`,
    [userId, productId]
  );

  return result.rows;
};

const deleteActivity = async (id) => {
  const result = await pool.query(
    `DELETE FROM activities
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createActivity,
  getAllActivities,
  getActivityById,
  getActivitiesByUser,
  getActivitiesByProduct,
  getUserProductActivities,
  deleteActivity,
};