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
const {
  createProduct,
  getAllProducts,
  getProductById,
  searchProducts,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Public/read routes
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:id", getProductById);

// Administrator-only management routes
router.post(
  "/",
  authenticate,
  authorize("Administrator"),
  createProduct
);

router.put(
  "/:id",
  authenticate,
  authorize("Administrator"),
  updateProduct
);

router.delete(
  "/:id",
  authenticate,
  authorize("Administrator"),
  deleteProduct
);

module.exports = router;