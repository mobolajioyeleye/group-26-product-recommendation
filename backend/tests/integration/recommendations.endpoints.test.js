const request = require("supertest");
const app = require("../../src/app");
const { generateAccessToken } = require("../../src/utils/auth");
const { createUser, deleteUser } = require("../../src/models/user.model");
const categoryService = require("../../src/services/category.service");
const productService = require("../../src/services/product.service");
const { createActivity, deleteActivity } = require("../../src/models/activity.model");
const { deleteProduct } = require("../../src/models/product.model");

describe("Integration Tests: Recommendation Endpoints (/api/recommendations)", () => {
  let testUser;
  let userCookie;
  let testCategory;
  let testProduct1, testProduct2;
  const createdActivityIds = [];

  beforeAll(async () => {
    // 1. Create category and products
    testCategory = await categoryService.createCategory(
      `Rec Cat ${Date.now()}`,
      "Category for recommendation integration testing"
    );
    testProduct1 = await productService.createProduct(
      `Rec Prod 1 ${Date.now()}`,
      "Description 1",
      49.99,
      testCategory.id,
      null,
      20
    );
    testProduct2 = await productService.createProduct(
      `Rec Prod 2 ${Date.now()}`,
      "Description 2",
      89.99,
      testCategory.id,
      null,
      15
    );

    // 2. Create user with interactions
    testUser = await createUser(
      "Recommendation Tester",
      `rec_test_${Date.now()}@group26.com`,
      "Password123!",
      "User"
    );
    const token = generateAccessToken(testUser);
    userCookie = `accessToken=${token}`;

    // Record interaction for testProduct1
    const act = await createActivity(testUser.id, testProduct1.id, "VIEW");
    createdActivityIds.push(act.id);
  });

  afterAll(async () => {
    for (const actId of createdActivityIds) {
      try {
        await deleteActivity(actId);
      } catch (e) {}
    }
    if (testProduct1) {
      try {
        await deleteProduct(testProduct1.id);
      } catch (e) {}
    }
    if (testProduct2) {
      try {
        await deleteProduct(testProduct2.id);
      } catch (e) {}
    }
    if (testCategory) {
      try {
        await categoryService.deleteCategory(testCategory.id);
      } catch (e) {}
    }
    if (testUser) {
      try {
        await deleteUser(testUser.id);
      } catch (e) {}
    }
  });

  test("1. GET /api/recommendations returns cold start fallback for guest (200 OK)", async () => {
    const res = await request(app).get("/api/recommendations?limit=4");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.personalized).toBe(false);
    expect(res.body.meta.reason).toBe("unauthenticated_cold_start");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(4);
  });

  test("2. GET /api/recommendations returns personalized recommendations for active user (200 OK)", async () => {
    const res = await request(app)
      .get("/api/recommendations?limit=5")
      .set("Cookie", [userCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.personalized).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    // Verified: viewed product (testProduct1) is strictly excluded
    const recIds = res.body.data.map((p) => p.id);
    expect(recIds).not.toContain(testProduct1.id);
  });

  test("3. GET /api/recommendations rejects invalid limit > 20 with 400 Bad Request", async () => {
    const res = await request(app).get("/api/recommendations?limit=50");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/limit/i);
  });
});
