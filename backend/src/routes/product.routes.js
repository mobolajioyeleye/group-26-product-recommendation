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