const categoryModel = require("../models/category.model");

// Create category
const createCategory = async (name, description) => {
  return await categoryModel.createCategory(name, description);
};

// Get all categories
const getAllCategories = async () => {
  return await categoryModel.getAllCategories();
};

// Get category by ID
const getCategoryById = async (id) => {
  return await categoryModel.getCategoryById(id);
};

// Update category
const updateCategory = async (id, name, description) => {
  return await categoryModel.updateCategory(id, name, description);
};

// Delete category
const deleteCategory = async (id) => {
  return await categoryModel.deleteCategory(id);
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};