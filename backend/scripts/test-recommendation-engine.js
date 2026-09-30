const pool = require("../src/config/database");
const { createUser, deleteUser } = require("../src/models/user.model");
const { createActivity, deleteActivity } = require("../src/models/activity.model");
const { createFavourite, deleteFavourite } = require("../src/models/favourite.model");
const { getAllProducts, getProductsByCategory } = require("../src/models/product.model");
const { getAllCategories } = require("../src/models/category.model");
const {
  getRecommendationsForUser,
  getColdStartRecommendations,
} = require("../src/services/recommendation.service");

const runRecommendationTests = async () => {
  const createdUserIds = [];
  const createdActivityIds = [];
  const createdFavourites = [];

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, description) => {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  };

  try {
    console.log("==================================================");
    console.log("RECOMMENDATION SYSTEM TEST SUITE");
    console.log("==================================================\n");

    const categories = await getAllCategories();
    const products = await getAllProducts();

    assert(categories.length >= 2, "Database has at least 2 categories");
    assert(products.length >= 10, "Database has at least 10 products");

    // Select two categories that each have at least 3 products
    const populatedCategories = categories.filter(
      (c) => products.filter((p) => p.category_id === c.id).length >= 3
    );
    assert(populatedCategories.length >= 2, "At least 2 categories have 3+ products");

    const cat1 = populatedCategories[0];
    const cat2 = populatedCategories[1];
    const cat1Products = products.filter((p) => p.category_id === cat1.id);
    const cat2Products = products.filter((p) => p.category_id === cat2.id);

    // ----------------------------------------------------
    // Scenario 1: Unauthenticated Cold Start (null userId)
    // ----------------------------------------------------
    console.log("Testing Scenario 1: Unauthenticated / Guest Cold Start...");
    const guestRecs = await getRecommendationsForUser(null, { limit: 5 });
    assert(guestRecs.recommendations.length === 5, "Returns exactly requested limit (5) for guest");
    assert(guestRecs.meta.personalized === false, "Marks recommendation as unpersonalized");
    assert(guestRecs.meta.reason === "unauthenticated_cold_start", "Reports cold start reason");

    // ----------------------------------------------------
    // Scenario 2: New Authenticated User with Zero Activity
    // ----------------------------------------------------
    console.log("\nTesting Scenario 2: New User with Zero Activity...");
    const newUser = await createUser(
      "Cold Start User",
      "coldstart_test@example.com",
      "password_hash"
    );
    createdUserIds.push(newUser.id);

    const newUserRecs = await getRecommendationsForUser(newUser.id, { limit: 6 });
    assert(newUserRecs.recommendations.length === 6, "Returns 6 recommendations for user with no activity");
    assert(newUserRecs.meta.personalized === false, "Reports personalized = false for cold start user");
    assert(newUserRecs.meta.reason === "no_activity_cold_start", "Reports no_activity_cold_start");

    // ----------------------------------------------------
    // Scenario 3: Single-Category Views Only
    // ----------------------------------------------------
    console.log("\nTesting Scenario 3: Single-Category Views Only...");
    const singleCatUser = await createUser(
      "Single Cat User",
      "singlecat_test@example.com",
      "password_hash"
    );
    createdUserIds.push(singleCatUser.id);

    // User views 2 products in Category 1
    const view1 = await createActivity(singleCatUser.id, cat1Products[0].id, "VIEW");
    const view2 = await createActivity(singleCatUser.id, cat1Products[1].id, "VIEW");
    createdActivityIds.push(view1.id, view2.id);

    const singleCatRecs = await getRecommendationsForUser(singleCatUser.id, { limit: 4 });
    assert(singleCatRecs.meta.personalized === true, "Marks recommendation as personalized");
    assert(singleCatRecs.meta.topCategories[0].categoryId === cat1.id, "Category 1 is identified as top category");
    
    // Check exclusion: view1 and view2 products must NOT be in recommendations
    const recIds = singleCatRecs.recommendations.map((r) => r.id);
    assert(!recIds.includes(cat1Products[0].id), "Excludes viewed product 1");
    assert(!recIds.includes(cat1Products[1].id), "Excludes viewed product 2");
    assert(
      singleCatRecs.recommendations.some((r) => r.category_id === cat1.id),
      "Includes alternative products from Category 1"
    );

    // ----------------------------------------------------
    // Scenario 4: Favourites Weighted More Heavily Than Views
    // ----------------------------------------------------
    console.log("\nTesting Scenario 4: Favourite Signal Weighting...");
    const weightedUser = await createUser(
      "Weighted User",
      "weighted_test@example.com",
      "password_hash"
    );
    createdUserIds.push(weightedUser.id);

    // User views 2 products in Category 1 (2 * 1 = 2 pts)
    const act1 = await createActivity(weightedUser.id, cat1Products[0].id, "VIEW");
    const act2 = await createActivity(weightedUser.id, cat1Products[1].id, "VIEW");
    createdActivityIds.push(act1.id, act2.id);

    // User favourites 1 product in Category 2 (1 * 3 = 3 pts)
    const favAct = await createActivity(weightedUser.id, cat2Products[0].id, "FAVOURITE");
    const favRow = await createFavourite(weightedUser.id, cat2Products[0].id);
    createdActivityIds.push(favAct.id);
    createdFavourites.push({ userId: weightedUser.id, productId: cat2Products[0].id });

    const weightedRecs = await getRecommendationsForUser(weightedUser.id, { limit: 5 });
    assert(
      weightedRecs.meta.topCategories[0].categoryId === cat2.id,
      "Category 2 with 1 Favourite (3 pts) ranks above Category 1 with 2 Views (2 pts)"
    );
    assert(weightedRecs.meta.topCategories[0].score === 3, "Category 2 score is exactly 3");
    assert(weightedRecs.meta.topCategories[1].score === 2, "Category 1 score is exactly 2");

    // ----------------------------------------------------
    // Scenario 5: Repeated Interactions Accumulate Score
    // ----------------------------------------------------
    console.log("\nTesting Scenario 5: Repeated Interactions...");
    // Add 3 more views to Category 1 (total views in Cat 1: 5 * 1 = 5 pts)
    const act3 = await createActivity(weightedUser.id, cat1Products[0].id, "VIEW");
    const act4 = await createActivity(weightedUser.id, cat1Products[1].id, "VIEW");
    const act5 = await createActivity(weightedUser.id, cat1Products[0].id, "VIEW");
    createdActivityIds.push(act3.id, act4.id, act5.id);

    const repeatedRecs = await getRecommendationsForUser(weightedUser.id, { limit: 5 });
    assert(
      repeatedRecs.meta.topCategories[0].categoryId === cat1.id,
      "Category 1 now overtakes Category 2 after repeated views (5 pts vs 3 pts)"
    );
    assert(repeatedRecs.meta.topCategories[0].score === 5, "Category 1 score accumulated to 5");

    // ----------------------------------------------------
    // Scenario 6: Strict Exclusion of Interacted Products
    // ----------------------------------------------------
    console.log("\nTesting Scenario 6: Interacted Products Exclusion...");
    const excludedIds = [cat1Products[0].id, cat1Products[1].id, cat2Products[0].id];
    const recommendedIds = repeatedRecs.recommendations.map((r) => r.id);
    const hasAnyExcluded = excludedIds.some((id) => recommendedIds.includes(id));
    assert(!hasAnyExcluded, "None of the viewed or favourited products appear in recommendations");

    // ----------------------------------------------------
    // Scenario 7: Fallback on Category Exhaustion
    // ----------------------------------------------------
    console.log("\nTesting Scenario 7: Fallback on Category Exhaustion...");
    const exhaustUser = await createUser(
      "Exhaust User",
      "exhaust_test@example.com",
      "password_hash"
    );
    createdUserIds.push(exhaustUser.id);

    // User views ALL products in Category 1
    for (const prod of cat1Products) {
      const act = await createActivity(exhaustUser.id, prod.id, "VIEW");
      createdActivityIds.push(act.id);
    }

    // Ask for 8 recommendations when all items in Cat 1 are exhausted
    const exhaustRecs = await getRecommendationsForUser(exhaustUser.id, { limit: 8 });
    assert(exhaustRecs.recommendations.length === 8, "Gracefully returns 8 recommendations despite exhausted category");
    // Verify that returned products are from other categories where alternatives exist
    const hasOtherCat = exhaustRecs.recommendations.some((r) => r.category_id !== cat1.id);
    assert(hasOtherCat, "Gracefully backfills products from other categories");

    // Verify strict exclusion: viewed products from Cat 1 must NEVER be recommended
    const cat1Ids = cat1Products.map((p) => p.id);
    const exhaustReturnedIds = exhaustRecs.recommendations.map((r) => r.id);
    const hasAnyViewedCat1 = cat1Ids.some((id) => exhaustReturnedIds.includes(id));
    assert(!hasAnyViewedCat1, "Strict exclusion: none of the viewed Category 1 products appear in recommendations");

    // ----------------------------------------------------
    // Scenario 8: Limit Clamping
    // ----------------------------------------------------
    console.log("\nTesting Scenario 8: Limit Clamping...");
    const clampedRecs = await getRecommendationsForUser(exhaustUser.id, { limit: 100 });
    assert(clampedRecs.recommendations.length <= 20, "Limits recommendations to maximum allowed (20)");

    // ----------------------------------------------------
    // Scenario 9: Complete Catalog Exhaustion
    // ----------------------------------------------------
    console.log("\nTesting Scenario 9: Complete Catalog Exhaustion...");
    const totalExhaustUser = await createUser(
      "Total Exhaust User",
      "total_exhaust_test@example.com",
      "password_hash"
    );
    createdUserIds.push(totalExhaustUser.id);

    // User views every single product in the catalog
    for (const prod of products) {
      const act = await createActivity(totalExhaustUser.id, prod.id, "VIEW");
      createdActivityIds.push(act.id);
    }

    const totalExhaustRecs = await getRecommendationsForUser(totalExhaustUser.id, { limit: 8 });
    assert(
      totalExhaustRecs.recommendations.length === 0,
      "Strict exclusion: returns empty array when all catalog products have been interacted with"
    );

    console.log("\n==================================================");
    console.log(`ALL RECOMMENDATION TESTS PASSED (${passedTests}/${totalTests})`);
    console.log("==================================================");
  } catch (error) {
    console.error("\nRecommendation test failed:", error);
    process.exitCode = 1;
  } finally {
    console.log("\nCleaning up temporary test data...");

    for (const actId of createdActivityIds) {
      try {
        await deleteActivity(actId);
      } catch (_) {}
    }

    for (const fav of createdFavourites) {
      try {
        await deleteFavourite(fav.userId, fav.productId);
      } catch (_) {}
    }

    for (const userId of createdUserIds) {
      try {
        await deleteUser(userId);
      } catch (_) {}
    }

    console.log("Cleanup complete.");
    await pool.end();
  }
};

runRecommendationTests();
