const express = require("express");

const router = express.Router();

const {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
  categoryProductValidator,
  searchProductValidator,
} = require("../validators/product.validator");

const validateRequest = require("../middleware/validation.middleware");

const productController = require("../controllers/product.controller");

// Create product
router.post(
  "/",
  createProductValidator,
  validateRequest,
  productController.createProduct
);

// Get all products
router.get(
  "/",
  productController.getAllProducts
);

// Get product by ID
router.get(
  "/:id",
  productIdValidator,
  validateRequest,
  productController.getProductById
);

// Get products by category
router.get(
  "/category/:categoryId",
  categoryProductValidator,
  validateRequest,
  productController.getProductsByCategory
);

// Search products
router.get(
  "/search",
  searchProductValidator,
  validateRequest,
  productController.searchProducts
);

// Update product
router.put(
  "/:id",
  updateProductValidator,
  validateRequest,
  productController.updateProduct
);

// Delete product
router.delete(
  "/:id",
  productIdValidator,
  validateRequest,
  productController.deleteProduct
);

module.exports = router;