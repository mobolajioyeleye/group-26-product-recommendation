const {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  updateProduct,
  deleteProduct,
} = require("../src/models/product.model");

const pool = require("../src/config/database");

const testProductModel = async () => {
  let productId;
  let categoryId;

  try {
    console.log("\nTesting getAllProducts...");
    const products = await getAllProducts();
    console.log(`Products found: ${products.length}`);

    categoryId = products[0].category_id;

    console.log("\nTesting getProductById...");
    const product = await getProductById(products[0].id);
    console.log(product);

    console.log("\nTesting getProductsByCategory...");
    const categoryProducts = await getProductsByCategory(categoryId);
    console.log(`Products in category: ${categoryProducts.length}`);

    console.log("\nTesting searchProducts...");
    const searchResults = await searchProducts("Apple");
    console.log(`Search results: ${searchResults.length}`);

    console.log("\nTesting createProduct...");
    const newProduct = await createProduct(
      "Test Product",
      "Temporary product for testing",
      99.99,
      categoryId,
      "https://example.com/test-product.jpg",
      10
    );

    productId = newProduct.id;
    console.log(newProduct);

    console.log("\nTesting updateProduct...");
    const updatedProduct = await updateProduct(
      productId,
      "Updated Test Product",
      "Updated temporary product",
      149.99,
      categoryId,
      "https://example.com/updated-product.jpg",
      20
    );
    console.log(updatedProduct);

    console.log("\nTesting deleteProduct...");
    const deletedProduct = await deleteProduct(productId);
    console.log(deletedProduct);

    console.log("\nAll product model tests passed.");
  } catch (error) {
    console.error("\nProduct model test failed:", error.message);
  } finally {
    await pool.end();
  }
};

testProductModel();