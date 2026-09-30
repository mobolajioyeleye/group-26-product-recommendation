const pool = require("../src/config/database");
const app = require("../src/app");
const { createUser, deleteUser } = require("../src/models/user.model");
const { getAllProducts } = require("../src/models/product.model");
const { generateAccessToken } = require("../src/utils/auth");
const { getRecommendationsForUser } = require("../src/services/recommendation.service");

const runTests = async () => {
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
    console.log("TASK B6: ACTIVITY & FAVOURITE APIs TEST SUITE");
    console.log("==================================================\n");

    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    const products = await getAllProducts();
    assert(products.length >= 3, "Database contains products for testing");
    const testProduct1 = products[0];
    const testProduct2 = products[1];
    const nonexistentProductId = "99999999-9999-9999-9999-999999999999";

    // Create 2 test users to test functionality and user isolation
    const userA = await createUser(
      "Test User A",
      "test_user_a_b6@example.com",
      "password_hash",
      "User"
    );
    const userB = await createUser(
      "Test User B",
      "test_user_b_b6@example.com",
      "password_hash",
      "User"
    );
    createdUserIds.push(userA.id, userB.id);

    const tokenA = generateAccessToken(userA);
    const tokenB = generateAccessToken(userB);

    const authHeadersA = {
      "Content-Type": "application/json",
      Cookie: `accessToken=${tokenA}`,
    };

    const authHeadersB = {
      "Content-Type": "application/json",
      Cookie: `accessToken=${tokenB}`,
    };

    // ------------------------------------------------------------------
    // TEST AREA 1: Product VIEW API (POST /api/activities/view)
    // ------------------------------------------------------------------
    console.log("\n--- Testing Product VIEW API ---");

    // TC 1: Unauthenticated request rejected
    const unauthViewRes = await fetch(`${baseUrl}/api/activities/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: testProduct1.id }),
    });
    assert(unauthViewRes.status === 401, "TC-01: Rejects unauthenticated view with 401");

    // TC 2: Nonexistent product returns 404
    const notFoundViewRes = await fetch(`${baseUrl}/api/activities/view`, {
      method: "POST",
      headers: authHeadersA,
      body: JSON.stringify({ productId: nonexistentProductId }),
    });
    assert(notFoundViewRes.status === 404, "TC-02: Returns 404 when viewing nonexistent product");

    // TC 3: Valid view recording
    const viewRes1 = await fetch(`${baseUrl}/api/activities/view`, {
      method: "POST",
      headers: authHeadersA,
      body: JSON.stringify({ productId: testProduct1.id }),
    });
    const viewData1 = await viewRes1.json();
    assert(viewRes1.status === 201, "TC-03: Records product view with 201 Created");
    assert(viewData1.data.user_id === userA.id, "TC-03: Associates view with authenticated User A");
    assert(viewData1.data.activity_type === "VIEW", "TC-03: Activity type is VIEW");

    // TC 4: Repeated view recording
    const viewRes2 = await fetch(`${baseUrl}/api/activities/view`, {
      method: "POST",
      headers: authHeadersA,
      body: JSON.stringify({ productId: testProduct1.id }),
    });
    const viewData2 = await viewRes2.json();
    assert(viewRes2.status === 201, "TC-04: Records repeated view with 201 Created");
    assert(viewData2.data.id !== viewData1.data.id, "TC-04: Creates distinct activity record for repeated view");

    // ------------------------------------------------------------------
    // TEST AREA 2: Retrieve User Activity API (GET /api/activities)
    // ------------------------------------------------------------------
    console.log("\n--- Testing Retrieve User Activity API ---");

    // TC 5: Unauthenticated request rejected
    const unauthActRes = await fetch(`${baseUrl}/api/activities`);
    assert(unauthActRes.status === 401, "TC-05: Rejects unauthenticated activity fetch with 401");

    // TC 6: Retrieve activities for User A
    const actResA = await fetch(`${baseUrl}/api/activities`, {
      headers: authHeadersA,
    });
    const actDataA = await actResA.json();
    assert(actResA.status === 200, "TC-06: Returns 200 OK for user activity retrieval");
    assert(actDataA.data.length >= 2, "TC-06: Returns recorded activities");
    assert(actDataA.data[0].product_name === testProduct1.name, "TC-06: Enriches activity with product_name");

    // TC 7: User isolation check (User B has 0 activities)
    const actResB = await fetch(`${baseUrl}/api/activities`, {
      headers: authHeadersB,
    });
    const actDataB = await actResB.json();
    assert(actDataB.data.length === 0, "TC-07: User B does not see User A's activities (user isolation)");

    // ------------------------------------------------------------------
    // TEST AREA 3: Add Favourite API (POST /api/favourites)
    // ------------------------------------------------------------------
    console.log("\n--- Testing Add Favourite API ---");

    // TC 8: Unauthenticated request rejected
    const unauthFavRes = await fetch(`${baseUrl}/api/favourites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: testProduct2.id }),
    });
    assert(unauthFavRes.status === 401, "TC-08: Rejects unauthenticated favourite add with 401");

    // TC 9: Nonexistent product returns 404
    const notFoundFavRes = await fetch(`${baseUrl}/api/favourites`, {
      method: "POST",
      headers: authHeadersA,
      body: JSON.stringify({ productId: nonexistentProductId }),
    });
    assert(notFoundFavRes.status === 404, "TC-09: Returns 404 when favouriting nonexistent product");

    // TC 10: Valid favourite add
    const addFavRes = await fetch(`${baseUrl}/api/favourites`, {
      method: "POST",
      headers: authHeadersA,
      body: JSON.stringify({ productId: testProduct2.id }),
    });
    const addFavData = await addFavRes.json();
    assert(addFavRes.status === 201, "TC-10: Adds favourite with 201 Created");
    assert(addFavData.data.product_id === testProduct2.id, "TC-10: Correct product ID in response");

    // Verify dual persistence: row in favourites AND row in activities with FAVOURITE
    const checkFavActRes = await fetch(`${baseUrl}/api/activities?type=FAVOURITE`, {
      headers: authHeadersA,
    });
    const checkFavActData = await checkFavActRes.json();
    assert(
      checkFavActData.data.some((a) => a.product_id === testProduct2.id && a.activity_type === "FAVOURITE"),
      "TC-10: Automatically records a 'FAVOURITE' event in activities table"
    );

    // TC 11: Duplicate favourite prevention
    const dupFavRes = await fetch(`${baseUrl}/api/favourites`, {
      method: "POST",
      headers: authHeadersA,
      body: JSON.stringify({ productId: testProduct2.id }),
    });
    assert(dupFavRes.status === 409, "TC-11: Rejects duplicate favourite with 409 Conflict");

    // ------------------------------------------------------------------
    // TEST AREA 4: Retrieve Favourites API (GET /api/favourites)
    // ------------------------------------------------------------------
    console.log("\n--- Testing Retrieve Favourites API ---");

    // TC 12: Retrieve favourites with full product details
    const getFavResA = await fetch(`${baseUrl}/api/favourites`, {
      headers: authHeadersA,
    });
    const getFavDataA = await getFavResA.json();
    assert(getFavResA.status === 200, "TC-12: Returns 200 OK for user favourites");
    assert(getFavDataA.data.length === 1, "TC-12: Returns exactly 1 favourite for User A");
    const favItem = getFavDataA.data[0];
    assert(favItem.name === testProduct2.name, "TC-12: Enriched with product name");
    assert(favItem.price !== undefined, "TC-12: Enriched with product price");
    assert(favItem.category_name !== null, "TC-12: Enriched with category name");
    assert(favItem.favourited_at !== undefined, "TC-12: Includes favourited_at timestamp");

    // TC 13: Empty favourites handling (User B has 0 favourites)
    const getFavResB = await fetch(`${baseUrl}/api/favourites`, {
      headers: authHeadersB,
    });
    const getFavDataB = await getFavResB.json();
    assert(getFavResB.status === 200, "TC-13: Returns 200 OK for user with no favourites");
    assert(Array.isArray(getFavDataB.data) && getFavDataB.data.length === 0, "TC-13: Returns empty array []");

    // ------------------------------------------------------------------
    // TEST AREA 5: Remove Favourite API (DELETE /api/favourites/:productId)
    // ------------------------------------------------------------------
    console.log("\n--- Testing Remove Favourite API ---");

    // TC 14: Unauthenticated request rejected
    const unauthDelRes = await fetch(`${baseUrl}/api/favourites/${testProduct2.id}`, {
      method: "DELETE",
    });
    assert(unauthDelRes.status === 401, "TC-14: Rejects unauthenticated delete with 401");

    // TC 15: User B cannot delete User A's favourite
    const userBDelRes = await fetch(`${baseUrl}/api/favourites/${testProduct2.id}`, {
      method: "DELETE",
      headers: authHeadersB,
    });
    assert(userBDelRes.status === 404, "TC-15: User B cannot delete User A's favourite (ownership check)");

    // TC 16: User A removes favourite
    const delResA = await fetch(`${baseUrl}/api/favourites/${testProduct2.id}`, {
      method: "DELETE",
      headers: authHeadersA,
    });
    assert(delResA.status === 200, "TC-16: Removes favourite with 200 OK");

    // Verify removal from favourites list
    const postDelFavRes = await fetch(`${baseUrl}/api/favourites`, {
      headers: authHeadersA,
    });
    const postDelFavData = await postDelFavRes.json();
    assert(postDelFavData.data.length === 0, "TC-16: Favourites list is now empty");

    // TC 17: Historical activity is preserved after removal
    const postDelActRes = await fetch(`${baseUrl}/api/activities?type=FAVOURITE`, {
      headers: authHeadersA,
    });
    const postDelActData = await postDelActRes.json();
    assert(
      postDelActData.data.some((a) => a.product_id === testProduct2.id),
      "TC-17: Historical FAVOURITE activity preserved in activities table for recommendations"
    );

    // TC 18: Removing already-removed favourite returns 404
    const repeatDelRes = await fetch(`${baseUrl}/api/favourites/${testProduct2.id}`, {
      method: "DELETE",
      headers: authHeadersA,
    });
    assert(repeatDelRes.status === 404, "TC-18: Returns 404 when removing already-removed favourite");

    // ------------------------------------------------------------------
    // TEST AREA 6: Recommendation Engine Integration
    // ------------------------------------------------------------------
    console.log("\n--- Testing Recommendation Engine Integration ---");

    // User A viewed testProduct1 twice. Check recommendation engine output.
    const recs = await getRecommendationsForUser(userA.id, { limit: 5 });
    assert(recs.meta.personalized === true, "TC-19: Recommendations are personalized based on recorded activity");
    assert(recs.meta.topCategories.length > 0, "TC-19: Identifies top categories from recorded views");
    const recIds = recs.recommendations.map((r) => r.id);
    assert(!recIds.includes(testProduct1.id), "TC-19: Recommendation engine excludes viewed product 1");

    console.log("\n==================================================");
    console.log(`ALL TASK B6 TESTS PASSED (${passed}/${total})`);
    console.log("==================================================");
  } catch (error) {
    console.error("\nTask B6 Test Failed:", error);
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

runTests();
