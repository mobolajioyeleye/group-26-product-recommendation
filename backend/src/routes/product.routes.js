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

const router = express.Router();

// Create a product
router.post("/", createProduct);

// Get all products
router.get("/", getAllProducts);

// Search products
// This must come before /:id
router.get("/search", searchProducts);

// Get products by category
// This must come before /:id
router.get("/category/:categoryId", getProductsByCategory);

// Get one product
router.get("/:id", getProductById);

// Update a product
router.put("/:id", updateProduct);

// Delete a product
router.delete("/:id", deleteProduct);

module.exports = router;