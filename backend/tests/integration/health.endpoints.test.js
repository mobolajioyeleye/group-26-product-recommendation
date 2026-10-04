const request = require("supertest");
const app = require("../../src/app");

describe("Integration Tests: Health Check Endpoint", () => {
  test("GET /api/health returns 200 OK with success confirmation", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message", "Group 26 API is running");
  });
});
