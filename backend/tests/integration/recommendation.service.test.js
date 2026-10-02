const {
  getRecommendationsForUser,
  getColdStartRecommendations,
} = require("../../src/services/recommendation.service");
const { createUser, deleteUser } = require("../../src/models/user.model");
const { createActivity, deleteActivity } = require("../../src/models/activity.model");
const { createFavourite, deleteFavourite } = require("../../src/models/favourite.model");
const { getAllProducts, getProductsByCategory } = require("../../src/models/product.model");
const { getAllCategories } = require("../../src/models/category.model");

describe("Integration Tests: Recommendation Engine Service (Task B7)", () => {
  const createdUserIds = [];
  const createdActivityIds = [];
  const createdFavourites = [];

  let categories = [];
  let products = [];
  let cat1, cat2;
  let cat1Products = [];
  let cat2Products = [];

  beforeAll(async () => {
    categories = await getAllCategories();
    products = await getAllProducts();

    expect(categories.length).toBeGreaterThanOrEqual(2);
    expect(products.length).toBeGreaterThanOrEqual(5);

    for (const cat of categories) {
      const prods = await getProductsByCategory(cat.id);
      if (prods.length >= 3 && !cat1) {
        cat1 = cat;
        cat1Products = prods;
      } else if (prods.length >= 3 && !cat2) {
        cat2 = cat;
        cat2Products = prods;
      }
    }

    expect(cat1).toBeDefined();
    expect(cat2).toBeDefined();
  });

  afterAll(async () => {
    // Cleanup temporary test data
    for (const fav of createdFavourites) {
      try {
        await deleteFavourite(fav.userId, fav.productId);
      } catch (e) {}
    }
    for (const actId of createdActivityIds) {
      try {
        await deleteActivity(actId);
      } catch (e) {}
    }
    for (const uId of createdUserIds) {
      try {
        await deleteUser(uId);
      } catch (e) {}
    }
  });

  test("Scenario 1: Unauthenticated Guest Cold Start", async () => {
    const guestRecs = await getRecommendationsForUser(null, { limit: 5 });
    expect(guestRecs.recommendations.length).toBe(5);
    expect(guestRecs.meta.personalized).toBe(false);
    expect(guestRecs.meta.reason).toBe("unauthenticated_cold_start");
  });

  test("Scenario 2: Authenticated New User with Zero Activity (Cold Start)", async () => {
    const newUser = await createUser(
      "Cold Start User",
      `cold_start_${Date.now()}@example.com`,
      "Password123!",
      "User"
    );
    createdUserIds.push(newUser.id);

    const newRecs = await getRecommendationsForUser(newUser.id, { limit: 6 });
    expect(newRecs.recommendations.length).toBe(6);
    expect(newRecs.meta.personalized).toBe(false);
    expect(newRecs.meta.reason).toBe("no_activity_cold_start");
  });

  test("Scenario 3: Single-Category Views Only Preference", async () => {
    const viewUser = await createUser(
      "View Preference User",
      `view_user_${Date.now()}@example.com`,
      "Password123!",
      "User"
    );
    createdUserIds.push(viewUser.id);

    // User views 2 products in Category 1
    const act1 = await createActivity(viewUser.id, cat1Products[0].id, "VIEW");
    const act2 = await createActivity(viewUser.id, cat1Products[1].id, "VIEW");
    createdActivityIds.push(act1.id, act2.id);

    const recs = await getRecommendationsForUser(viewUser.id, { limit: 4 });
    expect(recs.meta.personalized).toBe(true);
    expect(recs.meta.topCategories[0].categoryId).toBe(cat1.id);
    expect(recs.meta.topCategories[0].score).toBe(2);

    const recIds = recs.recommendations.map((r) => r.id);
    expect(recIds).not.toContain(cat1Products[0].id);
    expect(recIds).not.toContain(cat1Products[1].id);
    expect(recIds).toContain(cat1Products[2].id);
  });

  test("Scenario 4: Favourite Signal Weighting (1 Favourite = 3 pts > 2 Views = 2 pts)", async () => {
    const weightUser = await createUser(
      "Weight User",
      `weight_user_${Date.now()}@example.com`,
      "Password123!",
      "User"
    );
    createdUserIds.push(weightUser.id);

    // User views 2 products in Category 1 (2 points)
    const act1 = await createActivity(weightUser.id, cat1Products[0].id, "VIEW");
    const act2 = await createActivity(weightUser.id, cat1Products[1].id, "VIEW");
    createdActivityIds.push(act1.id, act2.id);

    // User favourites 1 product in Category 2 (3 points)
    const fav = await createFavourite(weightUser.id, cat2Products[0].id);
    createdFavourites.push({ userId: weightUser.id, productId: cat2Products[0].id });

    const recs = await getRecommendationsForUser(weightUser.id, { limit: 4 });
    expect(recs.meta.topCategories[0].categoryId).toBe(cat2.id);
    expect(recs.meta.topCategories[0].score).toBe(3);
    expect(recs.meta.topCategories[1].categoryId).toBe(cat1.id);
    expect(recs.meta.topCategories[1].score).toBe(2);
  });

  test("Scenario 5: Repeated Interactions Accumulate Score", async () => {
    const repeatUser = await createUser(
      "Repeat User",
      `repeat_user_${Date.now()}@example.com`,
      "Password123!",
      "User"
    );
    createdUserIds.push(repeatUser.id);

    // Initial favourite in Cat 2 (3 points)
    await createFavourite(repeatUser.id, cat2Products[0].id);
    createdFavourites.push({ userId: repeatUser.id, productId: cat2Products[0].id });

    // Repeated views in Cat 1 (4 views = 4 points)
    for (let i = 0; i < 4; i++) {
      const act = await createActivity(repeatUser.id, cat1Products[0].id, "VIEW");
      createdActivityIds.push(act.id);
    }

    const recs = await getRecommendationsForUser(repeatUser.id, { limit: 4 });
    expect(recs.meta.topCategories[0].categoryId).toBe(cat1.id);
    expect(recs.meta.topCategories[0].score).toBe(4);
    expect(recs.meta.topCategories[1].categoryId).toBe(cat2.id);
    expect(recs.meta.topCategories[1].score).toBe(3);
  });

  test("Scenario 6: Strict Interacted Products Exclusion", async () => {
    const exclUser = await createUser(
      "Exclusion User",
      `excl_user_${Date.now()}@example.com`,
      "Password123!",
      "User"
    );
    createdUserIds.push(exclUser.id);

    const a1 = await createActivity(exclUser.id, cat1Products[0].id, "VIEW");
    createdActivityIds.push(a1.id);
    const f1 = await createFavourite(exclUser.id, cat2Products[0].id);
    createdFavourites.push({ userId: exclUser.id, productId: cat2Products[0].id });

    const recs = await getRecommendationsForUser(exclUser.id, { limit: 10 });
    const recIds = recs.recommendations.map((r) => r.id);
    expect(recIds).not.toContain(cat1Products[0].id);
    expect(recIds).not.toContain(cat2Products[0].id);
  });

  test("Scenario 7: Fallback on Preferred Category Exhaustion Backfills Unseen Products", async () => {
    const exhaustUser = await createUser(
      "Exhaust User",
      `exhaust_user_${Date.now()}@example.com`,
      "Password123!",
      "User"
    );
    createdUserIds.push(exhaustUser.id);

    // View every product in Cat 1
    for (const p of cat1Products) {
      const a = await createActivity(exhaustUser.id, p.id, "VIEW");
      createdActivityIds.push(a.id);
    }

    const recs = await getRecommendationsForUser(exhaustUser.id, { limit: 5 });
    expect(recs.recommendations.length).toBeGreaterThan(0);

    const recIds = recs.recommendations.map((r) => r.id);
    for (const p of cat1Products) {
      expect(recIds).not.toContain(p.id);
    }
  });

  test("Scenario 8: Complete Catalog Exhaustion Returns Empty Array", async () => {
    const totalUser = await createUser(
      "Total User",
      `total_user_${Date.now()}@example.com`,
      "Password123!",
      "User"
    );
    createdUserIds.push(totalUser.id);

    // View all products in entire catalog
    for (const prod of products) {
      const a = await createActivity(totalUser.id, prod.id, "VIEW");
      createdActivityIds.push(a.id);
    }

    const recs = await getRecommendationsForUser(totalUser.id, { limit: 8 });
    expect(recs.recommendations).toEqual([]);
    expect(recs.meta.count).toBe(0);
  });
});
