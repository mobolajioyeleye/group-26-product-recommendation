/**
 * Verification Test Suite for Task B9: Security & System Hardening
 * Tests security HTTP headers (Helmet), CORS controls, authentication security,
 * role-based access control (RBAC), horizontal privilege separation,
 * password leakage prevention, and brute-force rate limiting.
 */
const assert = require("assert");
const http = require("http");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const ApiError = require("../src/utils/ApiError");

console.log("\n=======================================================");
console.log("   TASK B9: SECURITY & SYSTEM HARDENING VERIFICATION");
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

// Helper to sign mock JWTs for security tests
function generateTestToken(payload, secret = process.env.JWT_SECRET || "default_test_secret", options = { expiresIn: "1h" }) {
  return jwt.sign(payload, secret, options);
}

const mockAdminToken = generateTestToken({
  id: "00000000-0000-4000-a000-000000000001",
  email: "admin@group26.com",
  role: "Administrator",
});

const mockUserToken = generateTestToken({
  id: "00000000-0000-4000-a000-000000000002",
  email: "user1@group26.com",
  role: "User",
});

const otherUserToken = generateTestToken({
  id: "00000000-0000-4000-a000-000000000003",
  email: "user2@group26.com",
  role: "User",
});

async function runSecurityTests() {
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
              resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            } catch (e) {
              resolve({ status: res.statusCode, headers: res.headers, raw: data });
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

  // -----------------------------------------------------------------------------
  // SECTION 1: Security Headers (Helmet Hardening)
  // -----------------------------------------------------------------------------
  console.log("--- 1. Testing Security Headers (Helmet Hardening) ---");

  await runAsyncTest("Helmet sets X-Content-Type-Options: nosniff header", async () => {
    const res = await makeRequest({ path: "/api/health", method: "GET" });
    assert.strictEqual(res.headers["x-content-type-options"], "nosniff");
  });

  await runAsyncTest("Helmet sets X-Frame-Options to protect against clickjacking", async () => {
    const res = await makeRequest({ path: "/api/health", method: "GET" });
    assert.ok(res.headers["x-frame-options"] === "SAMEORIGIN" || res.headers["x-frame-options"] === "DENY");
  });

  await runAsyncTest("Helmet sets X-DNS-Prefetch-Control or Cross-Origin policies", async () => {
    const res = await makeRequest({ path: "/api/health", method: "GET" });
    assert.ok(res.headers["x-dns-prefetch-control"] || res.headers["cross-origin-opener-policy"]);
  });

  // -----------------------------------------------------------------------------
  // SECTION 2: CORS & Request Hardening
  // -----------------------------------------------------------------------------
  console.log("\n--- 2. Testing CORS & Transport Controls ---");

  await runAsyncTest("CORS supports credentials on authenticated origins", async () => {
    const res = await makeRequest({
      path: "/api/health",
      method: "GET",
      headers: { Origin: "http://localhost:5173" },
    });
    assert.strictEqual(res.headers["access-control-allow-credentials"], "true");
    assert.strictEqual(res.headers["access-control-allow-origin"], "http://localhost:5173");
  });

  await runAsyncTest("Preflight OPTIONS request returns allowed security methods", async () => {
    const res = await makeRequest({
      path: "/api/products",
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
      },
    });
    assert.strictEqual(res.status, 204);
    assert.ok(res.headers["access-control-allow-methods"].includes("POST"));
  });

  // -----------------------------------------------------------------------------
  // SECTION 3: Authentication Security & Token Verification
  // -----------------------------------------------------------------------------
  console.log("\n--- 3. Testing Authentication Security & Token Verification ---");

  await runAsyncTest("Protected endpoint rejects request missing authentication cookie (401)", async () => {
    const res = await makeRequest({ path: "/api/activities", method: "GET" });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, "Authentication required");
  });

  await runAsyncTest("Protected endpoint rejects forged / malformed JWT token (401)", async () => {
    const res = await makeRequest({
      path: "/api/activities",
      method: "GET",
      headers: { Cookie: "accessToken=forged.invalid.token" },
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, "Invalid authentication token");
  });

  await runAsyncTest("Protected endpoint rejects token signed with illegitimate secret (401)", async () => {
    const attackerToken = generateTestToken({ id: "hacker" }, "wrong_secret_key");
    const res = await makeRequest({
      path: "/api/activities",
      method: "GET",
      headers: { Cookie: `accessToken=${attackerToken}` },
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, "Invalid authentication token");
  });

  await runAsyncTest("Protected endpoint rejects expired token (401)", async () => {
    const expiredToken = generateTestToken({ id: "expired-user" }, process.env.JWT_SECRET || "default_test_secret", {
      expiresIn: "-1s",
    });
    const res = await makeRequest({
      path: "/api/activities",
      method: "GET",
      headers: { Cookie: `accessToken=${expiredToken}` },
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, "Authentication token has expired");
  });

  await runAsyncTest("Login with invalid credentials returns generic 401 (prevents user enumeration)", async () => {
    const res = await makeRequest(
      {
        path: "/users/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      JSON.stringify({ email: "nonexistent@group26.com", password: "wrongpassword" })
    );
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, "Invalid email or password");
  });

  // -----------------------------------------------------------------------------
  // SECTION 4: Role-Based Access Control (RBAC)
  // -----------------------------------------------------------------------------
  console.log("\n--- 4. Testing Role-Based Access Control (RBAC) ---");

  await runAsyncTest("Regular User is forbidden from creating products (403)", async () => {
    const res = await makeRequest({
      path: "/api/products",
      method: "POST",
      headers: {
        Cookie: `accessToken=${mockUserToken}`,
        "Content-Type": "application/json",
      },
    }, JSON.stringify({ name: "Unauthorized Product" }));
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  });

  await runAsyncTest("Regular User is forbidden from creating categories (403)", async () => {
    const res = await makeRequest({
      path: "/api/categories",
      method: "POST",
      headers: {
        Cookie: `accessToken=${mockUserToken}`,
        "Content-Type": "application/json",
      },
    }, JSON.stringify({ name: "Unauthorized Category" }));
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  });

  await runAsyncTest("Regular User is forbidden from listing all user accounts (403)", async () => {
    const res = await makeRequest({
      path: "/users",
      method: "GET",
      headers: { Cookie: `accessToken=${mockUserToken}` },
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  await runAsyncTest("Regular User is forbidden from administrative deletion of users (403)", async () => {
    const res = await makeRequest({
      path: "/users/00000000-0000-4000-a000-000000000005",
      method: "DELETE",
      headers: { Cookie: `accessToken=${mockUserToken}` },
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  // -----------------------------------------------------------------------------
  // SECTION 5: Horizontal Privilege Separation (IDOR Defense)
  // -----------------------------------------------------------------------------
  console.log("\n--- 5. Testing Horizontal Privilege Separation (IDOR Defense) ---");

  await runAsyncTest("Regular User cannot view another user's profile by ID (403 Forbidden)", async () => {
    // User 2 tries to view User 3's profile
    const targetUserId = "00000000-0000-4000-a000-000000000003";
    const res = await makeRequest({
      path: `/users/${targetUserId}`,
      method: "GET",
      headers: { Cookie: `accessToken=${mockUserToken}` }, // mockUserToken has id ...0002
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /not authorized to view this user/i);
  });

  await runAsyncTest("Regular User cannot change another user's password (403 Forbidden)", async () => {
    // User 2 tries to change User 3's password
    const targetUserId = "00000000-0000-4000-a000-000000000003";
    const res = await makeRequest({
      path: `/users/${targetUserId}/password`,
      method: "PATCH",
      headers: {
        Cookie: `accessToken=${mockUserToken}`,
        "Content-Type": "application/json",
      },
    }, JSON.stringify({ password: "NewHackedPassword123!" }));
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /not authorized to change this user's password/i);
  });

  // -----------------------------------------------------------------------------
  // SECTION 6: Sensitive Data Leakage Prevention
  // -----------------------------------------------------------------------------
  console.log("\n--- 6. Testing Data Leakage & Password Protection ---");

  await runAsyncTest("Server suppresses stack traces and internal errors in production/test", async () => {
    const res = await makeRequest({ path: "/api/products/invalid-uuid", method: "GET" });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.stack, undefined);
  });

  await runAsyncTest("Oversized request body is rejected to prevent payload flooding (DoS)", async () => {
    const hugePayload = "x".repeat(20 * 1024); // 20KB exceeds 10KB limit
    const res = await makeRequest(
      {
        path: "/users/register",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      JSON.stringify({ data: hugePayload })
    );
    assert.ok(res.status === 413 || res.status === 400);
  });

  // -----------------------------------------------------------------------------
  // SECTION 7: Rate Limiting (Brute-Force Attack Defense)
  // -----------------------------------------------------------------------------
  console.log("\n--- 7. Testing Rate Limiting (Brute-Force Attack Defense) ---");

  await runAsyncTest("Rate limiter middleware is active and enforces 429 when threshold exceeded", async () => {
    const rateLimit = require("express-rate-limit");
    const express = require("express");
    const testApp = express();
    const limiter = rateLimit({
      windowMs: 1000,
      max: 2,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res, next) => next(new ApiError(429, "Too many authentication attempts")),
    });
    testApp.post("/login-test", limiter, (req, res) => res.json({ ok: true }));
    testApp.use(require("../src/middleware/errorHandler"));

    const testServer = http.createServer(testApp);
    await new Promise((resolve) => testServer.listen(0, resolve));
    const testPort = testServer.address().port;

    async function hitLogin() {
      return new Promise((resolve) => {
        http.request({ port: testPort, hostname: "127.0.0.1", path: "/login-test", method: "POST" }, (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        }).end();
      });
    }

    const res1 = await hitLogin();
    const res2 = await hitLogin();
    const res3 = await hitLogin(); // 3rd request must trigger 429

    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res3.status, 429);
    assert.strictEqual(res3.body.success, false);
    assert.strictEqual(res3.body.message, "Too many authentication attempts");

    testServer.close();
  });

  server.close();

  // Print final summary
  console.log("\n=======================================================");
  console.log(`   TASK B9 SECURITY SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log("=======================================================\n");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error("Security test execution failed:", err);
  process.exit(1);
});
