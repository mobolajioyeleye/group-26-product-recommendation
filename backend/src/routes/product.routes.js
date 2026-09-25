const express = require("express");

const router = express.Router();

const validateRequest = require("../middleware/validation.middleware");

const {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateProductCategory,
} = require("../validators/product.validator");

const {
  validateProductQuery,
} = require("../validators/query.validator");

const productController = require("../controllers/product.controller");

// Create product
router.post(
  "/",
  validateCreateProduct,
  validateRequest,
  productController.createProduct
);

// Get all/search products
router.get(
  "/",
  validateProductQuery,
  validateRequest,
  productController.getAllProducts
);

// Get products by category
router.get(
  "/category/:categoryId",
  validateProductCategory,
  validateRequest,
  productController.getProductsByCategory
);

// Get single product
router.get(
  "/:id",
  validateProductId,
  validateRequest,
  productController.getProductById
);

// Update product
router.put(
  "/:id",
  validateUpdateProduct,
  validateRequest,
  productController.updateProduct
);

// Delete product
router.delete(
  "/:id",
  validateProductId,
  validateRequest,
  productController.deleteProduct
);

module.exports = router;