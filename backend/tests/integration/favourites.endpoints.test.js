const request = require("supertest");
const app = require("../../src/app");
const { generateAccessToken } = require("../../src/utils/auth");
const { createUser, deleteUser } = require("../../src/models/user.model");
const categoryService = require("../../src/services/category.service");
const productService = require("../../src/services/product.service");
const { deleteProduct } = require("../../src/models/product.model");
const { deleteFavourite } = require("../../src/models/favourite.model");

describe("Integration Tests: Favourites Endpoints (/api/favourites)", () => {
  let testUser;
  let userCookie;
  let testCategory;
  let testProduct;

  beforeAll(async () => {
    testUser = await createUser(
      "Favourite Tester",
      `fav_test_${Date.now()}@group26.com`,
      "Password123!",
      "User"
    );
    const token = generateAccessToken(testUser);
    userCookie = `accessToken=${token}`;

    testCategory = await categoryService.createCategory(
      `Fav Cat ${Date.now()}`,
      "Category for favourite testing"
    );
    testProduct = await productService.createProduct(
      `Fav Prod ${Date.now()}`,
      "Product for favourite testing",
      79.99,
      testCategory.id,
      null,
      15
    );
  });

  afterAll(async () => {
    if (testUser && testProduct) {
      try {
        await deleteFavourite(testUser.id, testProduct.id);
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

  test("1. POST /api/favourites requires authentication (401 Unauthorized)", async () => {
    const res = await request(app)
      .post("/api/favourites")
      .send({ productId: testProduct.id });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("2. POST /api/favourites adds a product to user favourites (201 Created)", async () => {
    const res = await request(app)
      .post("/api/favourites")
      .set("Cookie", [userCookie])
      .send({ productId: testProduct.id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("user_id", testUser.id);
    expect(res.body.data).toHaveProperty("product_id", testProduct.id);
  });

  test("3. POST /api/favourites rejects duplicate favourite with 409 Conflict", async () => {
    const res = await request(app)
      .post("/api/favourites")
      .set("Cookie", [userCookie])
      .send({ productId: testProduct.id });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("4. GET /api/favourites retrieves user's favourite list with details (200 OK)", async () => {
    const res = await request(app)
      .get("/api/favourites")
      .set("Cookie", [userCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((f) => f.product_id === testProduct.id)).toBe(true);
  });

  test("5. DELETE /api/favourites/:productId removes favourite successfully (200 OK)", async () => {
    const res = await request(app)
      .delete(`/api/favourites/${testProduct.id}`)
      .set("Cookie", [userCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("6. DELETE /api/favourites/:productId on non-favourited product returns 404 Not Found", async () => {
    const res = await request(app)
      .delete(`/api/favourites/${testProduct.id}`)
      .set("Cookie", [userCookie]);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
