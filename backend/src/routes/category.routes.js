const express = require("express");

const router = express.Router();

const validateRequest = require("../middleware/validation.middleware");

const {
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryId,
} = require("../validators/category.validator");

const categoryController = require("../controllers/category.controller");

router.post(
  "/",
  validateCreateCategory,
  validateRequest,
  categoryController.createCategory
);

router.get(
  "/",
  categoryController.getAllCategories
);

router.get(
  "/:id",
  validateCategoryId,
  validateRequest,
  categoryController.getCategoryById
);

router.put(
  "/:id",
  validateUpdateCategory,
  validateRequest,
  categoryController.updateCategory
);

router.delete(
  "/:id",
  validateCategoryId,
  validateRequest,
  categoryController.deleteCategory
);

module.exports = router;