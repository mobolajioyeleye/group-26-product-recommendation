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
);

router.put(
  "/:id",
  updateCategoryValidator,
  validateRequest,
  categoryController.updateCategory
);

router.delete(
  "/:id",
  categoryIdValidator,
  validateRequest,
  categoryController.deleteCategory
);

module.exports = router;