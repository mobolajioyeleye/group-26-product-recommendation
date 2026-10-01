const request = require("supertest");
const app = require("../../src/app");
const { generateAccessToken } = require("../../src/utils/auth");

describe("Error Contract Tests: Standard Error Responses & HTTP Status Codes", () => {
  const nonExistentUuid = "99999999-9999-4999-a999-999999999999"; // RFC 4122 v4 compliant
  let userCookie;
  let adminCookie;

  beforeAll(() => {
    const userToken = generateAccessToken({
      id: "00000000-0000-4000-a000-000000000002",
      email: "regularuser@group26.com",
      role: "User",
    });
    userCookie = `accessToken=${userToken}`;

    const adminToken = generateAccessToken({
      id: "00000000-0000-4000-a000-000000000001",
      email: "admin@group26.com",
      role: "Administrator",
    });
    adminCookie = `accessToken=${adminToken}`;
  });

  describe("400 Bad Request Contract", () => {
    test("returns standard { success: false, message: string } schema on bad request", async () => {
      const res = await request(app).post("/users/register").send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message");
      expect(typeof res.body.message).toBe("string");
    });
  });

  describe("401 Unauthorized Contract", () => {
    test("returns 401 when accessing protected route without cookie", async () => {
      const res = await request(app).get("/api/activities");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: "Authentication required",
      });
    });

    test("returns 401 when accessing protected route with invalid token", async () => {
      const res = await request(app)
        .get("/api/activities")
        .set("Cookie", ["accessToken=tampered-bad-token"]);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toMatch(/invalid or expired token/i);
    });
  });

  describe("403 Forbidden Contract", () => {
    test("returns 403 when regular User tries to access Administrator endpoint", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", [userCookie])
        .send({ name: "Forbidden Category" });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    test("returns 403 when regular User tries to view another user's profile", async () => {
      const res = await request(app)
        .get(`/users/${nonExistentUuid}`)
        .set("Cookie", [userCookie]);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toMatch(/not authorized/i);
    });
  });

  describe("404 Not Found Contract", () => {
    test("returns 404 for nonexistent route", async () => {
      const res = await request(app).get("/api/non-existent-route-xyz");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toMatch(/not found/i);
    });

    test("returns 404 when querying nonexistent product with valid UUID", async () => {
      const res = await request(app).get(`/api/products/${nonExistentUuid}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toMatch(/product not found/i);
    });

    test("returns 404 when querying nonexistent category with valid UUID", async () => {
      const res = await request(app).get(`/api/categories/${nonExistentUuid}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toMatch(/category not found/i);
    });
  });

  describe("409 Conflict Contract", () => {
    test("returns 409 when attempting duplicate user registration", async () => {
      const duplicateEmail = `conflict_${Date.now()}@group26.com`;

      // First registration
      await request(app).post("/users/register").send({
        name: "Conflict User",
        email: duplicateEmail,
        password: "Password123!",
      });

      // Second registration with same email
      const res = await request(app).post("/users/register").send({
        name: "Conflict User",
        email: duplicateEmail,
        password: "Password123!",
      });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });
});
