const express = require("express");
const router = express.Router();
const favouriteController = require("../controllers/favourite.controller");
const { authenticate } = require("../middleware/authMiddleware");

// POST /api/favourites - Add product to favourites
router.post("/", authenticate, favouriteController.addFavourite);

// DELETE /api/favourites/:productId - Remove product from favourites
router.delete("/:productId", authenticate, favouriteController.removeFavourite);

// GET /api/favourites - Retrieve user favourites with product details
router.get("/", authenticate, favouriteController.getUserFavourites);

module.exports = router;
