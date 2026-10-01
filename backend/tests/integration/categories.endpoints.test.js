const request = require("supertest");
const app = require("../../src/app");
const { generateAccessToken } = require("../../src/utils/auth");
const categoryService = require("../../src/services/category.service");

describe("Integration Tests: Categories Endpoints (/api/categories)", () => {
  let adminCookie;
  let createdCategoryId = null;

  beforeAll(() => {
    const adminToken = generateAccessToken({
      id: "00000000-0000-4000-a000-000000000001",
      email: "admin@group26.com",
      role: "Administrator",
    });
    adminCookie = `accessToken=${adminToken}`;
  });

  afterAll(async () => {
    if (createdCategoryId) {
      try {
        await categoryService.deleteCategory(createdCategoryId);
      } catch (e) {}
    }
  });

  test("1. GET /api/categories returns all categories without authentication (200 OK)", async () => {
    const res = await request(app).get("/api/categories");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("2. POST /api/categories requires authentication (401 Unauthorized without token)", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send({ name: "Unauthenticated Category", description: "Test" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("3. POST /api/categories allows Administrator to create category (201 Created)", async () => {
    const categoryName = `Test Category ${Date.now()}`;
    const res = await request(app)
      .post("/api/categories")
      .set("Cookie", [adminCookie])
      .send({
        name: categoryName,
        description: "A test category description",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.name).toBe(categoryName);

    createdCategoryId = res.body.data.id;
  });

  test("4. GET /api/categories/:id returns specific category details (200 OK)", async () => {
    const res = await request(app).get(`/api/categories/${createdCategoryId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdCategoryId);
  });

  test("5. PUT /api/categories/:id allows Administrator to update category (200 OK)", async () => {
    const updatedName = `Updated Category ${Date.now()}`;
    const res = await request(app)
      .put(`/api/categories/${createdCategoryId}`)
      .set("Cookie", [adminCookie])
      .send({
        name: updatedName,
        description: "Updated description text",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(updatedName);
  });

  test("6. DELETE /api/categories/:id allows Administrator to delete category (200 OK)", async () => {
    const res = await request(app)
      .delete(`/api/categories/${createdCategoryId}`)
      .set("Cookie", [adminCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify 404 on subsequent get
    const checkRes = await request(app).get(`/api/categories/${createdCategoryId}`);
    expect(checkRes.status).toBe(404);

    createdCategoryId = null; // Cleaned up
  });
});
