const productModel = require("../models/product.model");

// Create product
const createProduct = async (
  name,
  description,
  price,
  categoryId,
  imageUrl,
  stock
) => {
  return await productModel.createProduct(
    name,
    description,
    price,
    categoryId,
    imageUrl,
    stock
  );
};

// Get all products
const getAllProducts = async () => {
  return await productModel.getAllProducts();
};

// Get product by ID
const getProductById = async (id) => {
  return await productModel.getProductById(id);
};

// Search products
const searchProducts = async (searchTerm) => {
  return await productModel.searchProducts(searchTerm);
};

// Get products by category
const getProductsByCategory = async (categoryId) => {
  return await productModel.getProductsByCategory(categoryId);
};

// Update product
const updateProduct = async (
  id,
  name,
  description,
  price,
  categoryId,
  imageUrl,
  stock
) => {
  return await productModel.updateProduct(
    id,
    name,
    description,
    price,
    categoryId,
    imageUrl,
    stock
  );
};

// Delete product
const deleteProduct = async (id) => {
  return await productModel.deleteProduct(id);
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