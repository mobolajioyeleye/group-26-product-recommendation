const request = require("supertest");
const app = require("../../src/app");
const { generateAccessToken } = require("../../src/utils/auth");
const { createUser, deleteUser } = require("../../src/models/user.model");
const categoryService = require("../../src/services/category.service");
const productService = require("../../src/services/product.service");
const { deleteProduct } = require("../../src/models/product.model");
const { deleteActivity } = require("../../src/models/activity.model");

describe("Integration Tests: Activity Endpoints (/api/activities)", () => {
  let testUser;
  let userCookie;
  let testCategory;
  let testProduct;
  const recordedActivityIds = [];

  beforeAll(async () => {
    // 1. Create a test user
    testUser = await createUser(
      "Activity Tester",
      `activity_test_${Date.now()}@group26.com`,
      "Password123!",
      "User"
    );
    const token = generateAccessToken(testUser);
    userCookie = `accessToken=${token}`;

    // 2. Create category and product with valid RFC 4122 UUIDs
    testCategory = await categoryService.createCategory(
      `Activity Cat ${Date.now()}`,
      "Category for activity tests"
    );
    testProduct = await productService.createProduct(
      `Activity Prod ${Date.now()}`,
      "Product for activity testing",
      29.99,
      testCategory.id,
      null,
      10
    );
  });

  afterAll(async () => {
    for (const actId of recordedActivityIds) {
      try {
        await deleteActivity(actId);
      } catch (e) {}
    }
    if (testProduct) {
      try {
        await deleteProduct(testProduct.id);
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

  test("1. POST /api/activities/view requires authentication (401 Unauthorized)", async () => {
    const res = await request(app)
      .post("/api/activities/view")
      .send({ productId: testProduct.id });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("2. POST /api/activities/view records a view activity for authenticated user (201 Created)", async () => {
    const res = await request(app)
      .post("/api/activities/view")
      .set("Cookie", [userCookie])
      .send({ productId: testProduct.id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.product_id).toBe(testProduct.id);
    expect(res.body.data.activity_type).toBe("VIEW");

    recordedActivityIds.push(res.body.data.id);
  });

  test("3. GET /api/activities retrieves authenticated user's activity stream (200 OK)", async () => {
    const res = await request(app)
      .get("/api/activities")
      .set("Cookie", [userCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const match = res.body.data.find((a) => a.product_id === testProduct.id);
    expect(match).toBeDefined();
    expect(match.activity_type).toBe("VIEW");
  });

  test("4. GET /api/activities rejects unauthenticated requests (401 Unauthorized)", async () => {
    const res = await request(app).get("/api/activities");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
