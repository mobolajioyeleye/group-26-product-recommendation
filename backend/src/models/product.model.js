const pool = require("../config/database");

// Create a product
const createProduct = async (
  name,
  description,
  price,
  category_id,
  image_url,
  stock
) => {
  const result = await pool.query(
    `INSERT INTO products
      (name, description, price, category_id, image_url, stock)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, description, price, category_id, image_url, stock]
  );

  return result.rows[0];
};

// Get all products
const getAllProducts = async () => {
  const result = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     JOIN categories c ON p.category_id = c.id
     ORDER BY p.created_at DESC`
  );

  return result.rows;
};

// Get one product by ID
const getProductById = async (id) => {
  const result = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1`,
    [id]
  );

  return result.rows[0];
};

// Search products
const searchProducts = async (searchTerm) => {
  const result = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     JOIN categories c ON p.category_id = c.id
     WHERE p.name ILIKE $1
        OR p.description ILIKE $1
     ORDER BY p.created_at DESC`,
    [`%${searchTerm}%`]
  );

  return result.rows;
};

// Get products by category
const getProductsByCategory = async (categoryId) => {
  const result = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     JOIN categories c ON p.category_id = c.id
     WHERE p.category_id = $1
     ORDER BY p.created_at DESC`,
    [categoryId]
  );

  return result.rows;
};

// Update a product
const updateProduct = async (
  id,
  name,
  description,
  price,
  category_id,
  image_url,
  stock
) => {
  const result = await pool.query(
    `UPDATE products
     SET name = $1,
         description = $2,
         price = $3,
         category_id = $4,
         image_url = $5,
         stock = $6,
         updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [name, description, price, category_id, image_url, stock, id]
  );

  return result.rows[0];
};

// Delete a product
const deleteProduct = async (id) => {
  const result = await pool.query(
    `DELETE FROM products
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  searchProducts,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
};