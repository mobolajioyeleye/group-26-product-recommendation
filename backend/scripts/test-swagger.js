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
    assert(tagNames.includes("Products"), "TC-SWAG-02: Tag 'Products' is documented (Task B5)");
    assert(tagNames.includes("Categories"), "TC-SWAG-02: Tag 'Categories' is documented (Task B5)");

    // ----------------------------------------------------
    // Test 3: Verify Task B5, B6 & B7 Endpoint Paths
    // ----------------------------------------------------
    console.log("\n--- Test 3: Endpoint Paths Coverage ---");
    const paths = Object.keys(spec.paths);

    // Task B5: Categories & Products
    assert(paths.includes("/api/categories"), "TC-SWAG-03: /api/categories is mapped");
    assert(spec.paths["/api/categories"].get !== undefined, "TC-SWAG-03: GET /api/categories exists");
    assert(spec.paths["/api/categories"].post !== undefined, "TC-SWAG-03: POST /api/categories exists");
    assert(paths.includes("/api/categories/{id}"), "TC-SWAG-03: /api/categories/{id} is mapped");

    assert(paths.includes("/api/products"), "TC-SWAG-03: /api/products is mapped");
    assert(spec.paths["/api/products"].get !== undefined, "TC-SWAG-03: GET /api/products exists");
    assert(spec.paths["/api/products"].post !== undefined, "TC-SWAG-03: POST /api/products exists");
    assert(paths.includes("/api/products/search"), "TC-SWAG-03: GET /api/products/search is mapped");
    assert(paths.includes("/api/products/category/{categoryId}"), "TC-SWAG-03: GET /api/products/category/{categoryId} is mapped");
    assert(paths.includes("/api/products/{id}"), "TC-SWAG-03: /api/products/{id} is mapped");

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
    assert(paths.includes("/users/{id}"), "TC-SWAG-03: /users/{id} profile endpoints are mapped");
    assert(paths.includes("/users/{id}/password"), "TC-SWAG-03: PATCH /users/{id}/password is mapped");
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
    // Test 6: Verify Live Endpoints from Main
    // ----------------------------------------------------
    console.log("\n--- Test 6: Live API Endpoints (Categories, Products, Recommendations, Health) ---");
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert(healthRes.status === 200, "TC-SWAG-06: Health check returns HTTP 200 OK");
    const healthData = await healthRes.json();
    assert(healthData.success === true, "TC-SWAG-06: Health check reports success = true");

    const catRes = await fetch(`${baseUrl}/api/categories`);
    assert(catRes.status === 200, "TC-SWAG-06: Live GET /api/categories returns HTTP 200 OK");
    const catData = await catRes.json();
    assert(catData.success === true && Array.isArray(catData.data), "TC-SWAG-06: Categories data is valid array");

    const prodRes = await fetch(`${baseUrl}/api/products`);
    assert(prodRes.status === 200, "TC-SWAG-06: Live GET /api/products returns HTTP 200 OK");
    const prodData = await prodRes.json();
    assert(prodData.success === true && Array.isArray(prodData.data), "TC-SWAG-06: Products data is valid array");

    const recRes = await fetch(`${baseUrl}/api/recommendations`);
    assert(recRes.status === 200, "TC-SWAG-06: Live GET /api/recommendations returns HTTP 200 OK");
    const recData = await recRes.json();
    assert(recData.success === true && Array.isArray(recData.data), "TC-SWAG-06: Recommendations data is valid array");

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
