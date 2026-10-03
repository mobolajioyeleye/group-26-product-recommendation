import { apiRequest } from "./api.js";

/**
 * Admin API Service
 * Handles privileged product and category management operations
 * (Requires authenticated user with 'Administrator' role).
 */

/**
 * Create a new product.
 *
 * @param {Object} productData
 * @param {string} productData.name - Product title (2-255 characters)
 * @param {string} [productData.description] - Product description
 * @param {number|string} productData.price - Price (>= 0)
 * @param {string} productData.category_id - Database category UUID
 * @param {string} [productData.image_url] - Valid product image URL
 * @param {number|string} [productData.stock=0] - Available inventory units (>= 0)
 * @returns {Promise<Object>} Created product data
 */
export const createProduct = async (productData) => {
  const payload = {
    name: productData.name?.trim(),
    description: productData.description?.trim() || null,
    price: Number(productData.price),
    category_id: productData.category_id,
    image_url: productData.image_url?.trim() || null,
    stock: productData.stock !== undefined ? Number(productData.stock) : 0,
  };

  const response = await apiRequest("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response?.data;
};

/**
 * Update an existing product (Full edit: name, description, price, category, image, stock).
 *
 * @param {string} id - Product UUID
 * @param {Object} productData - Updated product fields
 * @returns {Promise<Object>} Updated product data
 */
export const updateProduct = async (id, productData) => {
  const payload = {
    name: productData.name?.trim(),
    description: productData.description?.trim() || null,
    price: Number(productData.price),
    category_id: productData.category_id,
    image_url: productData.image_url?.trim() || null,
    stock: productData.stock !== undefined ? Number(productData.stock) : 0,
  };

  const response = await apiRequest(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return response?.data;
};

/**
 * Delete a product by UUID.
 *
 * @param {string} id - Product UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteProduct = async (id) => {
  const response = await apiRequest(`/api/products/${id}`, {
    method: "DELETE",
  });

  return response?.data;
};

/**
 * Create a new category.
 *
 * @param {Object} categoryData
 * @param {string} categoryData.name - Category name
 * @param {string} [categoryData.description] - Category description
 * @returns {Promise<Object>} Created category data
 */
export const createCategory = async (categoryData) => {
  const payload = {
    name: categoryData.name?.trim(),
    description: categoryData.description?.trim() || null,
  };

  const response = await apiRequest("/api/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response?.data;
};

/**
 * Delete a category by UUID.
 *
 * @param {string} id - Category UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteCategory = async (id) => {
  const response = await apiRequest(`/api/categories/${id}`, {
    method: "DELETE",
  });

  return response?.data;
};
