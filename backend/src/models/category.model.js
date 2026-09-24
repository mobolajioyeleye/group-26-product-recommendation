const pool = require("../config/database");

// Create a category
const createCategory = async (name, description) => {
  const result = await pool.query(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     RETURNING *`,
    [name, description]
  );

  return result.rows[0];
};

// Get all categories
const getAllCategories = async () => {
  const result = await pool.query(
    `SELECT * FROM categories
     ORDER BY name ASC`
  );

  return result.rows;
};

// Get one category by ID
const getCategoryById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM categories
     WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

// Update a category
const updateCategory = async (id, name, description) => {
  const result = await pool.query(
    `UPDATE categories
     SET name = $1,
         description = $2
     WHERE id = $3
     RETURNING *`,
    [name, description, id]
  );

  return result.rows[0];
};

// Delete a category
const deleteCategory = async (id) => {
  const result = await pool.query(
    `DELETE FROM categories
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};