const request = require("supertest");
const app = require("../../src/app");
const swaggerSpec = require("../../src/docs/swagger.json");

describe("Contract Tests: Swagger UI & OpenAPI 3.0.3 Specification", () => {
  test("1. GET /api-docs/ serves the Swagger UI documentation interface (200 OK)", async () => {
    const res = await request(app).get("/api-docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("swagger-ui");
  });

  test("2. GET /api-docs.json returns the raw OpenAPI specification as JSON (200 OK)", async () => {
    const res = await request(app).get("/api-docs.json");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual(swaggerSpec);
  });

  test("3. OpenAPI specification conforms to OpenAPI 3.0.3 standards", () => {
    expect(swaggerSpec.openapi).toBe("3.0.3");
    expect(swaggerSpec.info).toBeDefined();
    expect(swaggerSpec.info.title).toBe("Group 26 - Product Recommendation API");
    expect(swaggerSpec.info.version).toBe("1.0.0");
    expect(swaggerSpec.paths).toBeDefined();
    expect(swaggerSpec.components).toBeDefined();
    expect(swaggerSpec.components.securitySchemes).toBeDefined();
    expect(swaggerSpec.components.securitySchemes.cookieAuth).toBeDefined();
  });

  test("4. All core application endpoints are documented in OpenAPI paths", () => {
    const requiredPaths = [
      "/api/health",
      "/users/register",
      "/users/login",
      "/users/logout",
      "/users",
      "/users/{id}",
      "/users/{id}/password",
      "/api/categories",
      "/api/categories/{id}",
      "/api/products",
      "/api/products/search",
      "/api/products/category/{categoryId}",
      "/api/products/{id}",
      "/api/activities/view",
      "/api/activities",
      "/api/favourites",
      "/api/favourites/{productId}",
      "/api/recommendations",
    ];

    const documentedPaths = Object.keys(swaggerSpec.paths);

    for (const requiredPath of requiredPaths) {
      expect(documentedPaths).toContain(requiredPath);
    }
  });

  test("5. Every documented path operation defines responses with status codes", () => {
    for (const [pathKey, operations] of Object.entries(swaggerSpec.paths)) {
      for (const [method, opDetails] of Object.entries(operations)) {
        expect(opDetails.responses).toBeDefined();
        const statusCodes = Object.keys(opDetails.responses);
        expect(statusCodes.length).toBeGreaterThan(0);

        // Expect at least one successful status code (200 or 201)
        const hasSuccessCode = statusCodes.some((code) =>
          ["200", "201"].includes(code)
        );
        expect(hasSuccessCode).toBe(true);
      }
    }
  });
});
