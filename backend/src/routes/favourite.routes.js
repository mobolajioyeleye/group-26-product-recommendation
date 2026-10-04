const express = require("express");
const router = express.Router();
const favouriteController = require("../controllers/favourite.controller");
const { authenticate } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  addFavouriteValidator,
  productIdFavouriteValidator,
} = require("../validators/favourite.validator");

// POST /api/favourites - Add product to favourites
router.post(
  "/",
  authenticate,
  addFavouriteValidator,
  validate,
  favouriteController.addFavourite
);

// DELETE /api/favourites/:productId - Remove product from favourites
router.delete(
  "/:productId",
  authenticate,
  productIdFavouriteValidator,
  validate,
  favouriteController.removeFavourite
);

// GET /api/favourites - Retrieve user favourites with product details
router.get("/", authenticate, favouriteController.getUserFavourites);

module.exports = router;
