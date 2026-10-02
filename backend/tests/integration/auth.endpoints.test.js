const request = require("supertest");
const app = require("../../src/app");
const { generateAccessToken } = require("../../src/utils/auth");
const { deleteUser } = require("../../src/models/user.model");

describe("Integration Tests: Auth & User Endpoints (/users)", () => {
  const timestamp = Date.now();
  const testEmail = `auth_test_${timestamp}@group26.com`;
  const testPassword = "Password123!";
  let createdUserId = null;
  let userCookie = null;
  let adminCookie = null;

  beforeAll(() => {
    // Generate admin cookie for cleanup and admin routes
    const adminToken = generateAccessToken({
      id: "00000000-0000-4000-a000-000000000001",
      email: "admin@group26.com",
      role: "Administrator",
    });
    adminCookie = `accessToken=${adminToken}`;
  });

  afterAll(async () => {
    if (createdUserId) {
      try {
        await deleteUser(createdUserId);
      } catch (e) {}
    }
  });

  test("1. POST /users/register successfully creates a new account (201 Created)", async () => {
    const res = await request(app)
      .post("/users/register")
      .send({
        name: "Auth Test User",
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.role).toBe("User");
    expect(res.body.user.password).toBeUndefined(); // password not exposed

    createdUserId = res.body.user.id;
  });

  test("2. POST /users/register rejects duplicate email with 409 Conflict", async () => {
    const res = await request(app)
      .post("/users/register")
      .send({
        name: "Duplicate User",
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test("3. POST /users/login rejects incorrect password with 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({
        email: testEmail,
        password: "WrongPassword999!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test("4. POST /users/login succeeds with correct credentials and issues cookie (200 OK)", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testEmail);

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const tokenCookie = cookies.find((c) => c.startsWith("accessToken="));
    expect(tokenCookie).toBeDefined();

    // Store cookie for subsequent authenticated calls
    userCookie = tokenCookie.split(";")[0];
  });

  test("5. GET /users/:id retrieves profile when authenticated as the user", async () => {
    const res = await request(app)
      .get(`/users/${createdUserId}`)
      .set("Cookie", [userCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.id).toBe(createdUserId);
    expect(res.body.user.email).toBe(testEmail);
  });

  test("6. PATCH /users/:id/password updates user password successfully", async () => {
    const newPassword = "NewPassword456!";
    const res = await request(app)
      .patch(`/users/${createdUserId}/password`)
      .set("Cookie", [userCookie])
      .send({
        password: newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify login with new password
    const loginRes = await request(app)
      .post("/users/login")
      .send({
        email: testEmail,
        password: newPassword,
      });
    expect(loginRes.status).toBe(200);
  });

  test("7. POST /users/logout clears authentication cookie (200 OK)", async () => {
    const res = await request(app).post("/users/logout");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
  });

  test("8. DELETE /users/:id allows Administrator to remove account (200 OK)", async () => {
    const res = await request(app)
      .delete(`/users/${createdUserId}`)
      .set("Cookie", [adminCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    createdUserId = null; // Cleaned up
  });
});
