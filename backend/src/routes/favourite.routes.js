const express = require("express");

const router = express.Router();

const validateRequest = require("../middleware/validation.middleware");

const {
  validateFavourite,
  validateFavouriteUser,
  validateFavouriteProduct,
} = require("../validators/favourite.validator");

const favouriteController = require("../controllers/favourite.controller");

router.post(
  "/:userId/:productId",
  validateFavourite,
  validateRequest,
  favouriteController.createFavourite
);

router.get(
  "/user/:userId",
  validateFavouriteUser,
  validateRequest,
  favouriteController.getFavouritesByUser
);

router.get(
  "/product/:productId",
  validateFavouriteProduct,
  validateRequest,
  favouriteController.getFavouritesByProduct
);

router.get(
  "/:userId/:productId",
  validateFavourite,
  validateRequest,
  favouriteController.getFavouriteByUserAndProduct
);

router.delete(
  "/:userId/:productId",
  validateFavourite,
  validateRequest,
  favouriteController.deleteFavourite
);

module.exports = router;