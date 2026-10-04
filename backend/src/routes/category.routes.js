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
const validate = require("../middleware/validate");
const {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdValidator,
} = require("../validators/category.validator");

const router = express.Router();

// Public/read routes
router.get("/", getAllCategories);
router.get("/:id", categoryIdValidator, validate, getCategoryById);

// Administrator-only management routes
router.post(
  "/",
  authenticate,
  authorize("Administrator"),
  createCategoryValidator,
  validate,
  createCategory
);

router.put(
  "/:id",
  authenticate,
  authorize("Administrator"),
  updateCategoryValidator,
  validate,
  updateCategory
);

router.delete(
  "/:id",
  authenticate,
  authorize("Administrator"),
  categoryIdValidator,
  validate,
  deleteCategory
);

module.exports = router;