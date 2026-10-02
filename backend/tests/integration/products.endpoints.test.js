const request = require("supertest");
const app = require("../../src/app");
const { generateAccessToken } = require("../../src/utils/auth");
const categoryService = require("../../src/services/category.service");
const { deleteProduct } = require("../../src/models/product.model");

describe("Integration Tests: Products Endpoints (/api/products)", () => {
  let adminCookie;
  let testCategory;
  let createdProductId = null;

  beforeAll(async () => {
    const adminToken = generateAccessToken({
      id: "00000000-0000-4000-a000-000000000001",
      email: "admin@group26.com",
      role: "Administrator",
    });
    adminCookie = `accessToken=${adminToken}`;

    // Create a dynamic category so it has a valid RFC 4122 UUID
    testCategory = await categoryService.createCategory(
      `Product Test Cat ${Date.now()}`,
      "Category for product tests"
    );
  });

  afterAll(async () => {
    if (createdProductId) {
      try {
        await deleteProduct(createdProductId);
      } catch (e) {}
    }
    if (testCategory) {
      try {
        await categoryService.deleteCategory(testCategory.id);
      } catch (e) {}
    }
  });

  test("1. GET /api/products returns product listing (200 OK)", async () => {
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("2. GET /api/products/search?q=a returns matching products (200 OK)", async () => {
    const res = await request(app).get("/api/products/search?q=a");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("3. GET /api/products/category/:categoryId returns category products (200 OK)", async () => {
    const res = await request(app).get(`/api/products/category/${testCategory.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("4. POST /api/products creates a product as Administrator (201 Created)", async () => {
    const prodName = `Test Product ${Date.now()}`;
    const res = await request(app)
      .post("/api/products")
      .set("Cookie", [adminCookie])
      .send({
        name: prodName,
        description: "Test product for integration suite",
        price: 49.99,
        category_id: testCategory.id,
        stock: 25,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.name).toBe(prodName);
    expect(Number(res.body.data.price)).toBe(49.99);

    createdProductId = res.body.data.id;
  });

  test("5. GET /api/products/:id retrieves the created product (200 OK)", async () => {
    const res = await request(app).get(`/api/products/${createdProductId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdProductId);
  });

  test("6. PUT /api/products/:id updates the product (200 OK)", async () => {
    const updatedName = `Updated Product ${Date.now()}`;
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set("Cookie", [adminCookie])
      .send({
        name: updatedName,
        description: "Updated product details",
        price: 59.99,
        category_id: testCategory.id,
        stock: 30,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(updatedName);
    expect(Number(res.body.data.price)).toBe(59.99);
  });

  test("7. DELETE /api/products/:id deletes the product (200 OK)", async () => {
    const res = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set("Cookie", [adminCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app).get(`/api/products/${createdProductId}`);
    expect(checkRes.status).toBe(404);

    createdProductId = null; // Cleaned up
  });
});
