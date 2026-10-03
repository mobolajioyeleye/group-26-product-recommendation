import assert from "node:assert";
import { isUUID, getFavourites, addFavourite, removeFavourite, resolveProductId } from "../src/services/favouritesApi.js";
import { recordProductView } from "../src/services/activityApi.js";

/* global process */

console.log("\n=======================================================");
console.log("   TASK F6: ACTIVITY & FAVOURITES VERIFICATION");
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

// -----------------------------------------------------------------------------
// 1. UUID Validation Tests
// -----------------------------------------------------------------------------
console.log("--- 1. Testing Identifier Validation (UUID vs Slugs) ---");

runTest("isUUID accepts valid RFC 4122 v4 UUID", () => {
  assert.strictEqual(isUUID("20000000-0000-0000-0000-000000000100"), true);
  assert.strictEqual(isUUID("c0a80123-0000-4000-a000-000000000001"), true);
});

runTest("isUUID rejects mock slugs and invalid strings", () => {
  assert.strictEqual(isUUID("earbuds"), false);
  assert.strictEqual(isUUID("smart-watch"), false);
  assert.strictEqual(isUUID(""), false);
  assert.strictEqual(isUUID(null), false);
  assert.strictEqual(isUUID(123), false);
});

// -----------------------------------------------------------------------------
// 2. Mock Contract & Fallback Tests
// -----------------------------------------------------------------------------
console.log("\n--- 2. Testing API Contract & Fallback Behaviors ---");

runTest("resolveProductId maps known mock slugs to database UUIDs", () => {
  assert.strictEqual(resolveProductId("earbuds"), "20000000-0000-0000-0000-000000000100");
  assert.strictEqual(resolveProductId("smart-watch"), "20000000-0000-0000-0000-000000000106");
});

await runAsyncTest("addFavourite rejects unmapped non-UUID with error", async () => {
  await assert.rejects(
    async () => addFavourite("unmapped-item-slug"),
    /invalid product ID format/i
  );
});

await runAsyncTest("removeFavourite rejects unmapped non-UUID with error", async () => {
  await assert.rejects(
    async () => removeFavourite("unmapped-item-slug"),
    /invalid product ID format/i
  );
});

await runAsyncTest("recordProductView ignores unmapped non-UUID without throwing", async () => {
  const result = await recordProductView("unmapped-item-slug");
  assert.strictEqual(result, null);
});

// -----------------------------------------------------------------------------
// 3. API Contract Format Verification (Mock fetch)
// -----------------------------------------------------------------------------
console.log("\n--- 3. Testing Network Request Construction ---");

await runAsyncTest("getFavourites issues GET request to /api/favourites with credentials", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedOptions = {};

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      json: async () => ({ success: true, count: 1, data: [{ product_id: "20000000-0000-0000-0000-000000000100" }] }),
    };
  };

  try {
    const data = await getFavourites();
    assert.strictEqual(capturedUrl.includes("/api/favourites"), true);
    assert.strictEqual(capturedOptions.method, "GET");
    assert.strictEqual(capturedOptions.credentials, "include");
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].product_id, "20000000-0000-0000-0000-000000000100");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("addFavourite issues POST request with { productId } body", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedOptions = {};

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      json: async () => ({ success: true, data: { product_id: "20000000-0000-0000-0000-000000000100" } }),
    };
  };

  try {
    await addFavourite("20000000-0000-0000-0000-000000000100");
    assert.strictEqual(capturedUrl.includes("/api/favourites"), true);
    assert.strictEqual(capturedOptions.method, "POST");
    assert.strictEqual(capturedOptions.credentials, "include");
    const parsedBody = JSON.parse(capturedOptions.body);
    assert.strictEqual(parsedBody.productId, "20000000-0000-0000-0000-000000000100");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("removeFavourite issues DELETE request to /api/favourites/:productId", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedOptions = {};

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      json: async () => ({ success: true, message: "Product removed from favourites" }),
    };
  };

  try {
    await removeFavourite("20000000-0000-0000-0000-000000000100");
    assert.strictEqual(capturedUrl.includes("/api/favourites/20000000-0000-0000-0000-000000000100"), true);
    assert.strictEqual(capturedOptions.method, "DELETE");
    assert.strictEqual(capturedOptions.credentials, "include");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("recordProductView issues POST request to /api/activities/view with { productId }", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedOptions = {};

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      json: async () => ({ success: true, message: "Product view recorded successfully" }),
    };
  };

  try {
    await recordProductView("20000000-0000-0000-0000-000000000100");
    assert.strictEqual(capturedUrl.includes("/api/activities/view"), true);
    assert.strictEqual(capturedOptions.method, "POST");
    assert.strictEqual(capturedOptions.credentials, "include");
    const parsedBody = JSON.parse(capturedOptions.body);
    assert.strictEqual(parsedBody.productId, "20000000-0000-0000-0000-000000000100");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("addFavourite propagates backend 404/400 errors without treating as offline success", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ message: "Product not found in catalog" }),
  });

  try {
    await assert.rejects(
      async () => addFavourite("20000000-0000-0000-0000-000000000100"),
      /Product not found in catalog/i
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("removeFavourite propagates backend 404 error without treating as offline success", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ message: "Favourite not found" }),
  });

  try {
    await assert.rejects(
      async () => removeFavourite("20000000-0000-0000-0000-000000000100"),
      /Favourite not found/i
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("addFavourite handles 409 Conflict as alreadyFavorited", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 409,
    json: async () => ({ message: "Product already in your favourites" }),
  });

  try {
    const result = await addFavourite("20000000-0000-0000-0000-000000000100");
    assert.strictEqual(result.alreadyFavorited, true);
    assert.strictEqual(result.product_id, "20000000-0000-0000-0000-000000000100");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

console.log("\n=======================================================");
console.log(`   TASK F6 VERIFICATION: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log("=======================================================\n");

if (passedTests !== totalTests) {
  process.exit(1);
}
