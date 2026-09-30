const pool = require("../src/config/database");
const app = require("../src/app");
const { createUser, deleteUser } = require("../src/models/user.model");
const { getAllProducts } = require("../src/models/product.model");
const { getAllCategories } = require("../src/models/category.model");
const { generateAccessToken } = require("../src/utils/auth");

const runRecommendationApiTests = async () => {
  let server;
  let baseUrl;
  const createdUserIds = [];

  let passed = 0;
  let total = 0;

  const assert = (condition, description) => {
    total++;
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  };

  try {
    console.log("==================================================");
    console.log("TASK B7: RECOMMENDATION API INTEGRATION TESTS");
    console.log("==================================================\n");

    // Start ephemeral Express server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    const products = await getAllProducts();
    const categories = await getAllCategories();
    assert(products.length >= 10, "Database has sufficient products for testing");
    assert(categories.length >= 2, "Database has sufficient categories for testing");

    // Identify two distinct categories with multiple products
    const populatedCategories = categories.filter(
      (c) => products.filter((p) => p.category_id === c.id).length >= 3
    );
    assert(populatedCategories.length >= 2, "Found at least 2 categories with 3+ products");

    const catA = populatedCategories[0];
    const catB = populatedCategories[1];
    const catAProducts = products.filter((p) => p.category_id === catA.id);
    const catBProducts = products.filter((p) => p.category_id === catB.id);

    // ------------------------------------------------------------------
    // TEST 1: Unauthenticated Guest Cold Start (Default Limit 8)
    // ------------------------------------------------------------------
    console.log("--- Testing Test 1: Unauthenticated Guest Cold Start ---");
    const guestRes = await fetch(`${baseUrl}/api/recommendations`);
    assert(guestRes.status === 200, "TC-01: Guest request returns HTTP 200 OK");
    const guestData = await guestRes.json();
    assert(guestData.success === true, "TC-01: Response indicates success = true");
    assert(Array.isArray(guestData.data), "TC-01: Response data is an array");
    assert(guestData.data.length === 8, "TC-01: Default limit returns 8 products");
    assert(guestData.meta.personalized === false, "TC-01: Meta indicates unpersonalized cold start");
    assert(guestData.meta.reason === "unauthenticated_cold_start", "TC-01: Reason is unauthenticated_cold_start");

    // ------------------------------------------------------------------
    // TEST 2: Custom Limit Parameter
    // ------------------------------------------------------------------
    console.log("\n--- Testing Test 2: Custom Limit Handling ---");
    const limit4Res = await fetch(`${baseUrl}/api/recommendations?limit=4`);
    assert(limit4Res.status === 200, "TC-02: Returns HTTP 200 with custom limit");
    const limit4Data = await limit4Res.json();
    assert(limit4Data.data.length === 4, "TC-02: Honors requested limit of 4");
    assert(limit4Data.meta.count === 4, "TC-02: Meta count matches 4");

    // ------------------------------------------------------------------
    // TEST 3: Limit Clamping (Max 20) & Invalid Limit Fallback
    // ------------------------------------------------------------------
    console.log("\n--- Testing Test 3: Limit Boundary Clamping ---");
    const clampRes = await fetch(`${baseUrl}/api/recommendations?limit=100`);
    const clampData = await clampRes.json();
    assert(clampData.data.length <= 20, "TC-03: Clamps excessively high limit to max (20)");

    const invalidLimitRes = await fetch(`${baseUrl}/api/recommendations?limit=invalid`);
    const invalidLimitData = await invalidLimitRes.json();
    assert(invalidLimitData.data.length === 8, "TC-03: Invalid limit safely defaults to 8");

    // ------------------------------------------------------------------
    // TEST 4: New User with Zero Activity via Bearer Auth Header
    // ------------------------------------------------------------------
    console.log("\n--- Testing Test 4: Authenticated New User (Cold Start) ---");
    const user1 = await createUser(
      "Rec Test User 1",
      "rec_test_user_1@example.com",
      "password_hash",
      "User"
    );
    createdUserIds.push(user1.id);

    const token1 = generateAccessToken({
      id: user1.id,
      email: user1.email,
      role: user1.role,
    });

    const authHeaders1 = {
      Authorization: `Bearer ${token1}`,
      Cookie: `accessToken=${token1}`,
      "Content-Type": "application/json",
    };

    const user1RecRes = await fetch(`${baseUrl}/api/recommendations`, {
      headers: authHeaders1,
    });
    assert(user1RecRes.status === 200, "TC-04: Returns HTTP 200 for authenticated user");
    const user1RecData = await user1RecRes.json();
    assert(user1RecData.meta.personalized === false, "TC-04: New user receives cold start fallback");
    assert(user1RecData.meta.reason === "no_activity_cold_start", "TC-04: Reason is no_activity_cold_start");

    // ------------------------------------------------------------------
    // TEST 5: Cookie-Based Authentication
    // ------------------------------------------------------------------
    console.log("\n--- Testing Test 5: Cookie-Based Authentication ---");
    const cookieRecRes = await fetch(`${baseUrl}/api/recommendations`, {
      headers: {
        Cookie: `accessToken=${token1}`,
      },
    });
    assert(cookieRecRes.status === 200, "TC-05: Returns HTTP 200 for cookie-authenticated request");
    const cookieRecData = await cookieRecRes.json();
    assert(cookieRecData.meta.reason === "no_activity_cold_start", "TC-05: Authenticated via cookie");

    // ------------------------------------------------------------------
    // TEST 6: Dynamic Recommendations Driven by Activity Ingestion
    // ------------------------------------------------------------------
    console.log("\n--- Testing Test 6: Ingestion to Recommendation Flow ---");

    // User views product 1 and product 2 in Category A
    const viewRes1 = await fetch(`${baseUrl}/api/activities/view`, {
      method: "POST",
      headers: authHeaders1,
      body: JSON.stringify({ productId: catAProducts[0].id }),
    });
    assert(viewRes1.status === 201, "TC-06: Recorded view 1 in Category A");

    const viewRes2 = await fetch(`${baseUrl}/api/activities/view`, {
      method: "POST",
      headers: authHeaders1,
      body: JSON.stringify({ productId: catAProducts[1].id }),
    });
    assert(viewRes2.status === 201, "TC-06: Recorded view 2 in Category A");

    // Fetch recommendations after views
    const postViewRecRes = await fetch(`${baseUrl}/api/recommendations?limit=6`, {
      headers: authHeaders1,
    });
    const postViewRecData = await postViewRecRes.json();

    assert(postViewRecData.meta.personalized === true, "TC-06: Recommendations are now personalized");
    assert(
      postViewRecData.meta.topCategories[0].categoryId === catA.id,
      "TC-06: Category A is top ranked category based on 2 views (score 2)"
    );
    assert(postViewRecData.meta.topCategories[0].score === 2, "TC-06: Category A score is exactly 2");

    // Verify exclusion of viewed products
    const returnedIds = postViewRecData.data.map((p) => p.id);
    assert(!returnedIds.includes(catAProducts[0].id), "TC-06: Viewed Product 1 is strictly excluded");
    assert(!returnedIds.includes(catAProducts[1].id), "TC-06: Viewed Product 2 is strictly excluded");
    assert(
      returnedIds.includes(catAProducts[2].id),
      "TC-06: Alternative un-viewed Product 3 in Category A is recommended"
    );

    // ------------------------------------------------------------------
    // TEST 7: Favourite Priority Shift (3x Weight Multiplier)
    // ------------------------------------------------------------------
    console.log("\n--- Testing Test 7: Favourite Multiplier Category Re-ranking ---");

    // User favourites 1 product in Category B (1 * 3 = 3 pts > 2 pts from Cat A)
    const favRes = await fetch(`${baseUrl}/api/favourites`, {
      method: "POST",
      headers: authHeaders1,
      body: JSON.stringify({ productId: catBProducts[0].id }),
    });
    assert(favRes.status === 201, "TC-07: Added product in Category B to favourites");

    const postFavRecRes = await fetch(`${baseUrl}/api/recommendations?limit=6`, {
      headers: authHeaders1,
    });
    const postFavRecData = await postFavRecRes.json();

    assert(
      postFavRecData.meta.topCategories[0].categoryId === catB.id,
      "TC-07: Category B (3 pts from 1 favourite) overtakes Category A (2 pts from 2 views)"
    );
    assert(postFavRecData.meta.topCategories[0].score === 3, "TC-07: Category B score is 3");
    assert(postFavRecData.meta.topCategories[1].score === 2, "TC-07: Category A score is 2");

    // Verify favourite is excluded from recommendations
    const postFavIds = postFavRecData.data.map((p) => p.id);
    assert(!postFavIds.includes(catBProducts[0].id), "TC-07: Favourited product is strictly excluded");

    // ------------------------------------------------------------------
    // TEST 8: Response Schema Contract
    // ------------------------------------------------------------------
    console.log("\n--- Testing Test 8: Response Schema Contract ---");
    const sampleRec = postFavRecData.data[0];
    assert(typeof sampleRec.id === "string", "TC-08: Product has id string");
    assert(typeof sampleRec.name === "string", "TC-08: Product has name string");
    assert(typeof sampleRec.category_id === "string", "TC-08: Product has category_id");
    assert(sampleRec.recommendation_reason !== undefined, "TC-08: Product has recommendation_reason string");

    console.log("\n==================================================");
    console.log(`ALL TASK B7 INTEGRATION TESTS PASSED (${passed}/${total})`);
    console.log("==================================================");
  } catch (error) {
    console.error("\nTask B7 Test Failed:", error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }

    console.log("\nCleaning up temporary test users...");
    for (const uid of createdUserIds) {
      try {
        await deleteUser(uid);
      } catch (_) {}
    }
    console.log("Cleanup complete.");
    await pool.end();
  }
};

runRecommendationApiTests();
