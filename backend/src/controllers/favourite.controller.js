const favouriteService = require("../services/favourite.service");

/**
 * Controller to add a product to the authenticated user's favourites.
 *
 * @route POST /api/favourites
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const addFavourite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const favourite = await favouriteService.addFavourite(userId, productId);

    res.status(201).json({
      success: true,
      message: "Product added to favourites",
      data: favourite,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to remove a product from the authenticated user's favourites.
 *
 * @route DELETE /api/favourites/:productId
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const removeFavourite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await favouriteService.removeFavourite(userId, productId);

    res.status(200).json({
      success: true,
      message: "Product removed from favourites",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve all favourite products for the authenticated user.
 *
 * @route GET /api/favourites
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const getUserFavourites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit } = req.query;

    const result = await favouriteService.getUserFavourites(userId, { limit });

    res.status(200).json({
      success: true,
      data: result.favourites,
      meta: {
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFavourite,
  removeFavourite,
  getUserFavourites,
};
