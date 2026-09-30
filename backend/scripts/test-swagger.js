const app = require("../src/app");
const pool = require("../src/config/database");

const runSwaggerValidation = async () => {
  let server;
  let baseUrl;
  let passed = 0;
  let total = 0;

  const assert = (condition, description) => {
    total++;
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  };

  try {
    console.log("==================================================");
    console.log("SWAGGER & OPENAPI SPECIFICATION VALIDATION");
    console.log("==================================================\n");

    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // ----------------------------------------------------
    // Test 1: Fetch OpenAPI JSON Spec (/api-docs.json)
    // ----------------------------------------------------
    console.log("--- Test 1: OpenAPI JSON Endpoint (/api-docs.json) ---");
    const jsonRes = await fetch(`${baseUrl}/api-docs.json`);
    assert(jsonRes.status === 200, "TC-SWAG-01: /api-docs.json returns HTTP 200 OK");
    const contentType = jsonRes.headers.get("content-type");
    assert(
      contentType && contentType.includes("application/json"),
      "TC-SWAG-01: Content-Type is application/json"
    );

    const spec = await jsonRes.json();
    assert(spec.openapi && spec.openapi.startsWith("3."), "TC-SWAG-01: Valid OpenAPI 3.x version");
    assert(spec.info && spec.info.title.includes("Group 26"), "TC-SWAG-01: API Title is present");

    // ----------------------------------------------------
    // Test 2: Verify Tags & Documentation Scope
    // ----------------------------------------------------
    console.log("\n--- Test 2: Tag Organization ---");
    const tagNames = spec.tags.map((t) => t.name);
    assert(tagNames.includes("Activities"), "TC-SWAG-02: Tag 'Activities' is documented (Task B6)");
    assert(tagNames.includes("Favourites"), "TC-SWAG-02: Tag 'Favourites' is documented (Task B6)");
    assert(tagNames.includes("Recommendations"), "TC-SWAG-02: Tag 'Recommendations' is documented (Task B7)");
    assert(tagNames.includes("Authentication"), "TC-SWAG-02: Tag 'Authentication' is documented");
    assert(tagNames.includes("Products"), "TC-SWAG-02: Tag 'Products' is documented (Pending PR)");
    assert(tagNames.includes("Categories"), "TC-SWAG-02: Tag 'Categories' is documented (Pending PR)");

    // ----------------------------------------------------
    // Test 3: Verify Task B6 & B7 Endpoint Paths
    // ----------------------------------------------------
    console.log("\n--- Test 3: Endpoint Paths Coverage ---");
    const paths = Object.keys(spec.paths);

    // Task B6
    assert(paths.includes("/api/activities/view"), "TC-SWAG-03: POST /api/activities/view is mapped");
    assert(spec.paths["/api/activities/view"].post !== undefined, "TC-SWAG-03: POST method exists on view endpoint");
    assert(paths.includes("/api/activities"), "TC-SWAG-03: GET /api/activities is mapped");
    assert(spec.paths["/api/activities"].get !== undefined, "TC-SWAG-03: GET method exists on activities endpoint");

    assert(paths.includes("/api/favourites"), "TC-SWAG-03: /api/favourites is mapped");
    assert(spec.paths["/api/favourites"].post !== undefined, "TC-SWAG-03: POST method exists on favourites");
    assert(spec.paths["/api/favourites"].get !== undefined, "TC-SWAG-03: GET method exists on favourites");
    assert(paths.includes("/api/favourites/{productId}"), "TC-SWAG-03: DELETE /api/favourites/{productId} is mapped");

    // Task B7
    assert(paths.includes("/api/recommendations"), "TC-SWAG-03: GET /api/recommendations is mapped");

    // Auth & System
    assert(paths.includes("/users/register"), "TC-SWAG-03: POST /users/register is mapped");
    assert(paths.includes("/users/login"), "TC-SWAG-03: POST /users/login is mapped");
    assert(paths.includes("/users/logout"), "TC-SWAG-03: POST /users/logout is mapped");
    assert(paths.includes("/api/health"), "TC-SWAG-03: GET /api/health is mapped");

    // ----------------------------------------------------
    // Test 4: Security Schemes Configuration
    // ----------------------------------------------------
    console.log("\n--- Test 4: Security Schemes & Authorize Functionality ---");
    assert(spec.components && spec.components.securitySchemes, "TC-SWAG-04: Security schemes are defined");
    assert(
      spec.components.securitySchemes.cookieAuth !== undefined,
      "TC-SWAG-04: cookieAuth scheme is defined for accessToken"
    );
    assert(
      spec.components.securitySchemes.cookieAuth.in === "cookie" &&
      spec.components.securitySchemes.cookieAuth.name === "accessToken",
      "TC-SWAG-04: cookieAuth correctly references cookie 'accessToken'"
    );
    assert(
      spec.components.securitySchemes.bearerAuth !== undefined,
      "TC-SWAG-04: bearerAuth scheme is defined for JWT"
    );

    // ----------------------------------------------------
    // Test 5: Verify Swagger UI HTML Interface (/api-docs)
    // ----------------------------------------------------
    console.log("\n--- Test 5: Swagger UI HTML Interface (/api-docs/) ---");
    const uiRes = await fetch(`${baseUrl}/api-docs/`);
    assert(uiRes.status === 200, "TC-SWAG-05: /api-docs/ returns HTTP 200 OK");
    const html = await uiRes.text();
    assert(html.includes("swagger-ui"), "TC-SWAG-05: HTML contains swagger-ui container");
    assert(html.toLowerCase().includes("swagger"), "TC-SWAG-05: HTML includes Swagger bundle assets");

    // ----------------------------------------------------
    // Test 6: Verify Health Endpoint Integrity
    // ----------------------------------------------------
    console.log("\n--- Test 6: Live API Health Check ---");
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert(healthRes.status === 200, "TC-SWAG-06: API health check returns HTTP 200 OK");
    const healthData = await healthRes.json();
    assert(healthData.success === true, "TC-SWAG-06: Health check reports success = true");

    console.log("\n==================================================");
    console.log(`ALL SWAGGER VALIDATION TESTS PASSED (${passed}/${total})`);
    console.log("==================================================");
  } catch (error) {
    console.error("\nSwagger validation failed:", error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();
  }
};

runSwaggerValidation();
