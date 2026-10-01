const productService = require("../services/product.service");
const ApiError = require("../utils/ApiError");

// Create product
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category_id,
      image_url,
      stock,
    } = req.body;

    if (!name || name.trim() === "") {
      return next(ApiError.badRequest("Product name is required"));
    }

    if (price === undefined || Number(price) < 0) {
      return next(ApiError.badRequest("Price must be 0 or greater"));
    }

    if (!category_id) {
      return next(ApiError.badRequest("Category ID is required"));
    }

    if (stock !== undefined && Number(stock) < 0) {
      return next(ApiError.badRequest("Stock must be 0 or greater"));
    }

    const product = await productService.createProduct(
      name.trim(),
      description || null,
      price,
      category_id,
      image_url || null,
      stock === undefined ? 0 : stock
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    if (error.code === "23503") {
      return next(ApiError.badRequest("Category not found"));
    }
    next(error);
  }
};

// Get all products
const getAllProducts = async (req, res, next) => {
  try {
    const products = await productService.getAllProducts();

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get product by ID
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productService.getProductById(id);

    if (!product) {
      return next(ApiError.notFound("Product not found"));
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Search products
const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return next(ApiError.badRequest("Search term is required"));
    }

    const products = await productService.searchProducts(q.trim());

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get products by category
const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const products = await productService.getProductsByCategory(categoryId);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Update product
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      price,
      category_id,
      image_url,
      stock,
    } = req.body;

    if (!name || name.trim() === "") {
      return next(ApiError.badRequest("Product name is required"));
    }

    if (price === undefined || Number(price) < 0) {
      return next(ApiError.badRequest("Price must be 0 or greater"));
    }

    if (!category_id) {
      return next(ApiError.badRequest("Category ID is required"));
    }

    if (stock !== undefined && Number(stock) < 0) {
      return next(ApiError.badRequest("Stock must be 0 or greater"));
    }

    const product = await productService.updateProduct(
      id,
      name.trim(),
      description || null,
      price,
      category_id,
      image_url || null,
      stock === undefined ? 0 : stock
    );

    if (!product) {
      return next(ApiError.notFound("Product not found"));
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (error.code === "23503") {
      return next(ApiError.badRequest("Category not found"));
    }
    next(error);
  }
};

// Delete product
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productService.deleteProduct(id);

    if (!product) {
      return next(ApiError.notFound("Product not found"));
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
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