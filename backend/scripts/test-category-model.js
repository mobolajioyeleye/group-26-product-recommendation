const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../src/models/category.model");

const pool = require("../src/config/database");

const testCategoryModel = async () => {
  let categoryId;

  try {
    console.log("\nTesting getAllCategories...");
    const categories = await getAllCategories();
    console.log(`Categories found: ${categories.length}`);

    console.log("\nTesting createCategory...");
    const newCategory = await createCategory(
      "Test Category",
      "Temporary category for testing"
    );

    categoryId = newCategory.id;
    console.log(newCategory);

    console.log("\nTesting getCategoryById...");
    const category = await getCategoryById(categoryId);
    console.log(category);

    console.log("\nTesting updateCategory...");
    const updatedCategory = await updateCategory(
      categoryId,
      "Updated Test Category",
      "Updated temporary category"
    );
    console.log(updatedCategory);

    console.log("\nTesting deleteCategory...");
    const deletedCategory = await deleteCategory(categoryId);
    console.log(deletedCategory);

    console.log("\nAll category model tests passed.");
  } catch (error) {
    console.error("\nCategory model test failed:", error.message);
  } finally {
    await pool.end();
  }
};

testCategoryModel();