const {
  createFavourite,
  getAllFavourites,
  getFavouriteByUserAndProduct,
  getFavouritesByUser,
  getFavouritesByProduct,
  deleteFavourite,
} = require("../src/models/favourite.model");

const pool = require("../src/config/database");

const testFavouriteModel = async () => {
  let userId;
  let productId;

  try {
    console.log("\nTesting getAllFavourites...");
    const favourites = await getAllFavourites();
    console.log(`Favourites found: ${favourites.length}`);

    userId = favourites[0].user_id;
    productId = favourites[0].product_id;

    console.log("\nTesting getFavouriteByUserAndProduct...");
    const favourite = await getFavouriteByUserAndProduct(
      userId,
      productId
    );
    console.log(favourite);

    console.log("\nTesting getFavouritesByUser...");
    const userFavourites = await getFavouritesByUser(userId);
    console.log(`Favourites for user: ${userFavourites.length}`);

    console.log("\nTesting getFavouritesByProduct...");
    const productFavourites = await getFavouritesByProduct(productId);
    console.log(`Favourites for product: ${productFavourites.length}`);

    console.log("\nTesting createFavourite...");

    const newFavourite = await createFavourite(
      "30000000-0000-0000-0000-000000000001",
      "20000000-0000-0000-0000-000000000078"
    );

    console.log(newFavourite);

    console.log("\nTesting deleteFavourite...");

    const deletedFavourite = await deleteFavourite(
      newFavourite.user_id,
      newFavourite.product_id
    );

    console.log(deletedFavourite);

    console.log("\nAll favourite model tests passed.");
  } catch (error) {
    console.error("\nFavourite model test failed:", error.message);
  } finally {
    await pool.end();
  }
};

testFavouriteModel();
