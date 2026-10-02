const request = require("supertest");
const express = require("express");
const app = require("../../src/app");
const { generateAccessToken } = require("../../src/utils/auth");
const { registerValidator } = require("../../src/validators/auth.validator");
const { createProductValidator } = require("../../src/validators/product.validator");
const validate = require("../../src/middleware/validate");
const errorHandler = require("../../src/middleware/errorHandler");

describe("Validation Tests: Request Input & Boundary Validation", () => {
  let adminCookie;
  let userCookie;

  beforeAll(() => {
    const adminToken = generateAccessToken({
      id: "00000000-0000-4000-a000-000000000001",
      email: "admin@group26.com",
      role: "Administrator",
    });
    adminCookie = `accessToken=${adminToken}`;

    const userToken = generateAccessToken({
      id: "00000000-0000-4000-a000-000000000002",
      email: "user@group26.com",
      role: "User",
    });
    userCookie = `accessToken=${userToken}`;
  });

  describe("Auth & User Validation", () => {
    test("rejects user registration with missing required fields (400 Bad Request)", async () => {
      const res = await request(app).post("/users/register").send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(typeof res.body.message).toBe("string");
    });

    test("rejects user registration with invalid email format (400 Bad Request)", async () => {
      const res = await request(app).post("/users/register").send({
        name: "Test User",
        email: "not-a-valid-email",
        password: "ValidPassword123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid email/i);
    });

    test("rejects user registration with weak password (400 Bad Request)", async () => {
      const res = await request(app).post("/users/register").send({
        name: "Test User",
        email: "valid@group26.com",
        password: "123", // too short
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/password/i);
    });

    test("rejects user login with missing password (400 Bad Request)", async () => {
      const res = await request(app).post("/users/login").send({
        email: "admin@group26.com",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Product Input & Boundary Validation", () => {
    test("rejects product creation with negative price (400 Bad Request)", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Cookie", [adminCookie])
        .send({
          name: "Invalid Price Product",
          price: -19.99,
          category_id: "00000000-0000-4000-a000-000000000001",
          stock: 10,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/price/i);
    });

    test("rejects product creation with negative stock quantity (400 Bad Request)", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Cookie", [adminCookie])
        .send({
          name: "Invalid Stock Product",
          price: 29.99,
          category_id: "00000000-0000-4000-a000-000000000001",
          stock: -5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/stock/i);
    });

    test("rejects product search with empty query string (400 Bad Request)", async () => {
      const res = await request(app).get("/api/products/search?q=");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/search/i);
    });
  });

  describe("UUID Parameter & Body Validation", () => {
    const invalidUUID = "123-not-a-valid-uuid";

    test("rejects malformed UUID in GET /users/:id (400 Bad Request)", async () => {
      const res = await request(app)
        .get(`/users/${invalidUUID}`)
        .set("Cookie", [adminCookie]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/uuid/i);
    });

    test("rejects malformed UUID in GET /api/categories/:id (400 Bad Request)", async () => {
      const res = await request(app).get(`/api/categories/${invalidUUID}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/uuid/i);
    });

    test("rejects malformed UUID in GET /api/products/:id (400 Bad Request)", async () => {
      const res = await request(app).get(`/api/products/${invalidUUID}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/uuid/i);
    });

    test("rejects malformed UUID in POST /api/activities/view body (400 Bad Request)", async () => {
      const res = await request(app)
        .post("/api/activities/view")
        .set("Cookie", [userCookie])
        .send({ productId: invalidUUID });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/uuid/i);
    });

    test("rejects malformed UUID in POST /api/favourites body (400 Bad Request)", async () => {
      const res = await request(app)
        .post("/api/favourites")
        .set("Cookie", [userCookie])
        .send({ productId: invalidUUID });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/uuid/i);
    });

    test("rejects malformed UUID in DELETE /api/favourites/:productId (400 Bad Request)", async () => {
      const res = await request(app)
        .delete(`/api/favourites/${invalidUUID}`)
        .set("Cookie", [userCookie]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/uuid/i);
    });
  });

  describe("Query Parameter Boundary Validation", () => {
    test("rejects recommendations limit > 20 (400 Bad Request)", async () => {
      const res = await request(app).get("/api/recommendations?limit=25");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/between 1 and 20/i);
    });

    test("rejects recommendations limit < 1 (400 Bad Request)", async () => {
      const res = await request(app).get("/api/recommendations?limit=0");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/between 1 and 20/i);
    });
  });

  describe("B4 Validation Middleware Halts Before Controller", () => {
    let testApp;
    let mockController;

    beforeEach(() => {
      mockController = jest.fn((req, res) =>
        res.status(200).json({ success: true, message: "Controller reached" })
      );
      testApp = express();
      testApp.use(express.json());
      testApp.post("/test-register", registerValidator, validate, mockController);
      testApp.post("/test-product", createProductValidator, validate, mockController);
      testApp.use(errorHandler);
    });

    test("B4 validation middleware rejects invalid registration and halts before controller is called", async () => {
      const res = await request(testApp)
        .post("/test-register")
        .send({ email: "invalid-email" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(mockController).not.toHaveBeenCalled();
    });

    test("B4 validation middleware rejects invalid product payload and halts before controller is called", async () => {
      const res = await request(testApp)
        .post("/test-product")
        .send({ price: -10, stock: -5 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(mockController).not.toHaveBeenCalled();
    });

    test("passes execution to controller when B4 validation succeeds", async () => {
      const res = await request(testApp)
        .post("/test-register")
        .send({
          name: "Valid User",
          email: "valid@example.com",
          password: "ValidPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Controller reached");
      expect(mockController).toHaveBeenCalledTimes(1);
    });
  });
});
