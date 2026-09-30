const express = require("express");

const router = express.Router();

const {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdValidator,
} = require("../validators/category.validator");

const validateRequest = require("../middleware/validation.middleware");

const categoryController = require("../controllers/category.controller");

router.post(
  "/",
  createCategoryValidator,
  validateRequest,
  categoryController.createCategory
);

router.get(
  "/",
  categoryController.getAllCategories
);

router.get(
  "/:id",
  categoryIdValidator,
  validateRequest,
  categoryController.getCategoryById
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
  updateCategoryValidator,
  validateRequest,
  categoryController.updateCategory
  authenticate,
  authorize("Administrator"),
  updateCategory
);

router.delete(
  "/:id",
  categoryIdValidator,
  validateRequest,
  categoryController.deleteCategory
  authenticate,
  authorize("Administrator"),
  deleteCategory
);

module.exports = router;