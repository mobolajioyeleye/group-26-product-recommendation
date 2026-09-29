const express = require("express");

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Public/read routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Administrator-only management routes
router.post(
  "/",
  authenticate,
  authorize("Administrator"),
  createCategory
);

router.put(
  "/:id",
  authenticate,
  authorize("Administrator"),
  updateCategory
);

router.delete(
  "/:id",
  authenticate,
  authorize("Administrator"),
  deleteCategory
);

module.exports = router;