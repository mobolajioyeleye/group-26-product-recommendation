const pool = require("../config/database");

const createProduct = async (
  name,
  description,
  price,
  categoryId,
  imageUrl,
  stock
) => {
  const result = await pool.query(
    `INSERT INTO products
      (name, description, price, category_id, image_url, stock)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, description, price, category_id, image_url, stock,
               created_at, updated_at`,
    [name, description, price, categoryId, imageUrl, stock]
  );

  return result.rows[0];
};

const getAllProducts = async () => {
  const result = await pool.query(
    `SELECT id, name, description, price, category_id, image_url, stock,
            created_at, updated_at
     FROM products
     ORDER BY created_at DESC`
  );

  return result.rows;
};

const getProductById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, description, price, category_id, image_url, stock,
            created_at, updated_at
     FROM products
     WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

const getProductsByCategory = async (categoryId) => {
  const result = await pool.query(
    `SELECT id, name, description, price, category_id, image_url, stock,
            created_at, updated_at
     FROM products
     WHERE category_id = $1
     ORDER BY created_at DESC`,
    [categoryId]
  );

  return result.rows;
};

const searchProducts = async (searchTerm) => {
  const result = await pool.query(
    `SELECT id, name, description, price, category_id, image_url, stock,
            created_at, updated_at
     FROM products
     WHERE name ILIKE $1
        OR description ILIKE $1
     ORDER BY name ASC`,
    [`%${searchTerm}%`]
  );

  return result.rows;
};

const updateProduct = async (
  id,
  name,
  description,
  price,
  categoryId,
  imageUrl,
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
     RETURNING id, name, description, price, category_id, image_url, stock,
               created_at, updated_at`,
    [name, description, price, categoryId, imageUrl, stock, id]
  );

  return result.rows[0];
};

const deleteProduct = async (id) => {
  const result = await pool.query(
    `DELETE FROM products
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  updateProduct,
  deleteProduct,
};