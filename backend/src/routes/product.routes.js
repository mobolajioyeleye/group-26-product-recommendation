const express = require("express");

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
const validate = require("../middleware/validate");
const {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
  categoryProductValidator,
  searchProductValidator,
} = require("../validators/product.validator");
const {
  paginationValidator,
  productQueryValidator,
} = require("../validators/query.validator");

const router = express.Router();

// Public/read routes
router.get("/", paginationValidator, validate, getAllProducts);
router.get(
  "/search",
  productQueryValidator,
  searchProductValidator,
  validate,
  searchProducts
);
router.get(
  "/category/:categoryId",
  categoryProductValidator,
  validate,
  getProductsByCategory
);
router.get("/:id", productIdValidator, validate, getProductById);

// Administrator-only management routes
router.post(
  "/",
  authenticate,
  authorize("Administrator"),
  createProductValidator,
  validate,
  createProduct
);

router.put(
  "/:id",
  authenticate,
  authorize("Administrator"),
  updateProductValidator,
  validate,
  updateProduct
);

router.delete(
  "/:id",
  authenticate,
  authorize("Administrator"),
  productIdValidator,
  validate,
  deleteProduct
);

module.exports = router;