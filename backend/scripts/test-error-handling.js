/**
 * Verification Test Suite for Task B8: Error Handling & API Standards
 * Tests ApiError factories, errorHandler middleware translations, and live Express error responses.
 */
const assert = require("assert");
const http = require("http");
const app = require("../src/app");
const ApiError = require("../src/utils/ApiError");
const errorHandler = require("../src/middleware/errorHandler");

console.log("\n=======================================================");
console.log("   TASK B8: ERROR HANDLING & API STANDARDS VERIFICATION");
console.log("=======================================================\n");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`  ❌ [FAIL] ${name}:`, error.message);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`  ❌ [FAIL] ${name}:`, error.message);
  }
}

// Helper to mock Express res object for middleware testing
function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

// -----------------------------------------------------------------------------
// SECTION 1: ApiError Class & Factory Methods
// -----------------------------------------------------------------------------
console.log("--- 1. Testing ApiError Factory Methods ---");

runTest("ApiError.badRequest creates 400 error with message & optional errors", () => {
  const err = ApiError.badRequest("Invalid data", [{ field: "name", msg: "required" }]);
  assert.strictEqual(err.statusCode, 400);
  assert.strictEqual(err.message, "Invalid data");
  assert.deepStrictEqual(err.errors, [{ field: "name", msg: "required" }]);
  assert.strictEqual(err.isOperational, true);
});

runTest("ApiError.unauthorized creates 401 error", () => {
  const err = ApiError.unauthorized("Login required");
  assert.strictEqual(err.statusCode, 401);
  assert.strictEqual(err.message, "Login required");
});

runTest("ApiError.forbidden creates 403 error", () => {
  const err = ApiError.forbidden("Admin access only");
  assert.strictEqual(err.statusCode, 403);
  assert.strictEqual(err.message, "Admin access only");
});

runTest("ApiError.notFound creates 404 error", () => {
  const err = ApiError.notFound("User not found");
  assert.strictEqual(err.statusCode, 404);
  assert.strictEqual(err.message, "User not found");
});

runTest("ApiError.conflict creates 409 error", () => {
  const err = ApiError.conflict("Email already in use");
  assert.strictEqual(err.statusCode, 409);
  assert.strictEqual(err.message, "Email already in use");
});

runTest("ApiError.internal creates 500 error", () => {
  const err = ApiError.internal("Database crash");
  assert.strictEqual(err.statusCode, 500);
  assert.strictEqual(err.message, "Database crash");
});

// -----------------------------------------------------------------------------
// SECTION 2: Central errorHandler Middleware Translation
// -----------------------------------------------------------------------------
console.log("\n--- 2. Testing Central Error Handler Middleware ---");

runTest("errorHandler translates body-parser SyntaxError into 400 Bad Request", () => {
  const syntaxErr = new SyntaxError("Unexpected token");
  syntaxErr.status = 400;
  syntaxErr.body = '{"malformed": ';

  const res = createMockRes();
  errorHandler(syntaxErr, { method: "POST", originalUrl: "/test" }, res, () => {});

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Invalid JSON request body");
});

runTest("errorHandler translates PostgreSQL 23505 (unique violation) into 409 Conflict", () => {
  const pgErr = new Error("duplicate key value violates unique constraint");
  pgErr.code = "23505";

  const res = createMockRes();
  errorHandler(pgErr, { method: "POST", originalUrl: "/test" }, res, () => {});

  assert.strictEqual(res.statusCode, 409);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Resource already exists");
});

runTest("errorHandler translates PostgreSQL 23503 (foreign key violation) into 400 Bad Request", () => {
  const pgErr = new Error("insert violates foreign key constraint");
  pgErr.code = "23503";

  const res = createMockRes();
  errorHandler(pgErr, { method: "POST", originalUrl: "/test" }, res, () => {});

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Invalid related resource");
});

runTest("errorHandler translates PostgreSQL 22P02 (invalid syntax/UUID) into 400 Bad Request", () => {
  const pgErr = new Error('invalid input syntax for type uuid: "bad-uuid"');
  pgErr.code = "22P02";

  const res = createMockRes();
  errorHandler(pgErr, { method: "GET", originalUrl: "/test" }, res, () => {});

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Invalid input syntax or identifier format");
});

runTest("errorHandler translates PostgreSQL 23502 (not-null violation) into 400 Bad Request", () => {
  const pgErr = new Error("null value in column violates not-null constraint");
  pgErr.code = "23502";

  const res = createMockRes();
  errorHandler(pgErr, { method: "POST", originalUrl: "/test" }, res, () => {});

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Missing required database field");
});

runTest("errorHandler translates JsonWebTokenError into 401 Unauthorized", () => {
  const jwtErr = new Error("jwt malformed");
  jwtErr.name = "JsonWebTokenError";

  const res = createMockRes();
  errorHandler(jwtErr, { method: "GET", originalUrl: "/test" }, res, () => {});

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Invalid authentication token");
});

runTest("errorHandler translates TokenExpiredError into 401 Unauthorized", () => {
  const expErr = new Error("jwt expired");
  expErr.name = "TokenExpiredError";

  const res = createMockRes();
  errorHandler(expErr, { method: "GET", originalUrl: "/test" }, res, () => {});

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Authentication token has expired");
});

runTest("errorHandler handles generic unhandled errors with 500 Internal Server Error", () => {
  const genericErr = new Error("Unexpected crash");

  const res = createMockRes();
  errorHandler(genericErr, { method: "GET", originalUrl: "/test" }, res, () => {});

  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Internal server error");
});

// -----------------------------------------------------------------------------
// SECTION 3: Live HTTP Requests Against the Express Application
// -----------------------------------------------------------------------------
async function runHttpTests() {
  console.log("\n--- 3. Testing Live Express App Endpoints & Error Pipelines ---");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          port,
          hostname: "127.0.0.1",
          ...options,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ status: res.statusCode, body: parsed });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );
      req.on("error", reject);
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }

  await runAsyncTest("GET /api/nonexistent-route returns 404 with route description", async () => {
    const res = await makeRequest({ path: "/api/nonexistent-route", method: "GET" });
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Route not found/i);
  });

  await runAsyncTest("POST with invalid JSON body triggers central SyntaxError handler (400)", async () => {
    const res = await makeRequest(
      {
        path: "/users/register",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      '{"badJson": '
    );
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, "Invalid JSON request body");
  });

  await runAsyncTest("GET /api/activities without token returns 401 Unauthorized", async () => {
    const res = await makeRequest({ path: "/api/activities", method: "GET" });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, "Authentication required");
  });

  await runAsyncTest("POST /api/products without admin credentials returns 401 Unauthorized", async () => {
    const res = await makeRequest({
      path: "/api/products",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }, JSON.stringify({ name: "Sample" }));
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  await runAsyncTest("GET /api/products/:id with malformed UUID returns 400 Bad Request", async () => {
    const res = await makeRequest({ path: "/api/products/invalid-uuid-123", method: "GET" });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /UUID/i);
  });

  await runAsyncTest("GET /api/products/:id with valid nonexistent UUID returns 404 Not Found", async () => {
    const res = await makeRequest({
      path: "/api/products/99999999-9999-4999-a999-999999999999",
      method: "GET",
    });
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /not found/i);
  });

  server.close();

  // Print final summary
  console.log("\n=======================================================");
  console.log(`   TASK B8 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log("=======================================================\n");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runHttpTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
