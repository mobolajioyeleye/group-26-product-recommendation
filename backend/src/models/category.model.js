const pool = require("../config/database");

// Create a new category
const createCategory = async (name, description) => {
  const result = await pool.query(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     RETURNING id, name, description`,
    [name, description]
  );

  return result.rows[0];
};

// Retrieve all categories ordered alphabetically by name
const getAllCategories = async () => {
  const result = await pool.query(
    `SELECT id, name, description
     FROM categories
     ORDER BY name ASC`
  );

  return result.rows;
};

// Retrieve a single category by ID
const getCategoryById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, description
     FROM categories
     WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

// Update a category's name and description by ID
const updateCategory = async (id, name, description) => {
  const result = await pool.query(
    `UPDATE categories
     SET name = $1,
         description = $2
     WHERE id = $3
     RETURNING id, name, description`,
    [name, description, id]
  );

  return result.rows[0];
};

// Delete a category by ID
const deleteCategory = async (id) => {
  const result = await pool.query(
    `DELETE FROM categories
     WHERE id = $1
     RETURNING id`,
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