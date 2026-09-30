const express = require("express");

const router = express.Router();

const {
  productFavouriteValidator,
  userIdValidator,
  productIdFavouriteValidator,
} = require("../validators/favourite.validator");

const validateRequest = require("../middleware/validation.middleware");

const favouriteController = require("../controllers/favourite.controller");

// Add favourite
router.post(
  "/:userId/:productId",
  productFavouriteValidator,
  validateRequest,
  favouriteController.createFavourite
);

// Get all favourites for a user
router.get(
  "/user/:userId",
  userIdValidator,
  validateRequest,
  favouriteController.getFavouritesByUser
);

// Get favourites for a product
router.get(
  "/product/:productId",
  productIdFavouriteValidator,
  validateRequest,
  favouriteController.getFavouritesByProduct
);

// Get specific favourite
router.get(
  "/:userId/:productId",
  productFavouriteValidator,
  validateRequest,
  favouriteController.getFavouriteByUserAndProduct
);

// Delete favourite
router.delete(
  "/:userId/:productId",
  productFavouriteValidator,
  validateRequest,
  favouriteController.deleteFavourite
);

module.exports = router;
