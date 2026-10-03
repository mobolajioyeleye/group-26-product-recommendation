import assert from "node:assert";
import { getRecommendations, normalizeRecommendations } from "../src/services/recommendationApi.js";

/* global process */

console.log("\n=======================================================");
console.log("   TASK F7: RECOMMENDATION UI VERIFICATION");
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
// 1. Data Normalization Tests
// -----------------------------------------------------------------------------
console.log("--- 1. Testing Recommendation Normalization ---");

runTest("normalizeRecommendations formats backend recommendation items correctly", () => {
  const rawItems = [
    {
      id: "20000000-0000-0000-0000-000000000100",
      name: "Apple Airpods",
      description: "Wireless earbuds",
      price: "129.99",
      category_name: "Electronics",
      image_url: "https://example.com/airpods.jpg",
      stock: "15",
      recommendation_reason: "Based on your interest in Electronics",
    },
  ];

  const normalized = normalizeRecommendations(rawItems);
  assert.strictEqual(normalized.length, 1);
  assert.strictEqual(normalized[0].id, "20000000-0000-0000-0000-000000000100");
  assert.strictEqual(normalized[0].name, "Apple Airpods");
  assert.strictEqual(normalized[0].price, 129.99);
  assert.strictEqual(normalized[0].category, "Electronics");
  assert.strictEqual(normalized[0].image, "https://example.com/airpods.jpg");
  assert.strictEqual(normalized[0].stock, 15);
  assert.strictEqual(normalized[0].recommendationReason, "Based on your interest in Electronics");
  assert.strictEqual(typeof normalized[0].rating, "number");
});

runTest("normalizeRecommendations safely handles empty or invalid inputs", () => {
  assert.deepStrictEqual(normalizeRecommendations(null), []);
  assert.deepStrictEqual(normalizeRecommendations(undefined), []);
  assert.deepStrictEqual(normalizeRecommendations([]), []);
});

// -----------------------------------------------------------------------------
// 2. API Request Construction Tests
// -----------------------------------------------------------------------------
console.log("\n--- 2. Testing Network Request Construction ---");

await runAsyncTest("getRecommendations issues GET to /api/recommendations with limit query param", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedOptions = {};

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: "20000000-0000-0000-0000-000000000100",
            name: "Apple Airpods",
            price: "129.99",
            category_name: "Electronics",
            recommendation_reason: "Popular discovery pick",
          },
        ],
        meta: {
          total: 1,
          count: 1,
          personalized: false,
          reason: "unauthenticated_cold_start",
        },
      }),
    };
  };

  try {
    const result = await getRecommendations({ limit: 12 });
    assert.strictEqual(capturedUrl.includes("/api/recommendations?limit=12"), true);
    assert.strictEqual(capturedOptions.method, "GET");
    assert.strictEqual(capturedOptions.credentials, "include");
    assert.strictEqual(result.recommendations.length, 1);
    assert.strictEqual(result.meta.personalized, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("getRecommendations preserves personalized metadata from backend", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      success: true,
      data: [
        {
          id: "20000000-0000-0000-0000-000000000123",
          name: "iPhone 13 Pro",
          price: "999.00",
          category_name: "Electronics",
          recommendation_reason: "Based on your interest in Electronics",
        },
      ],
      meta: {
        total: 1,
        count: 1,
        personalized: true,
        topCategories: [{ categoryId: "cat-1", categoryName: "Electronics", score: 5 }],
      },
    }),
  });

  try {
    const result = await getRecommendations({ limit: 5 });
    assert.strictEqual(result.meta.personalized, true);
    assert.strictEqual(result.meta.topCategories[0].categoryName, "Electronics");
    assert.strictEqual(result.recommendations[0].recommendationReason, "Based on your interest in Electronics");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("getRecommendations propagates API errors cleanly", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ message: "Internal server error" }),
  });

  try {
    await assert.rejects(
      async () => getRecommendations(),
      /Internal server error/i
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

console.log("\n=======================================================");
console.log(`   TASK F7 VERIFICATION: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log("=======================================================\n");

if (passedTests !== totalTests) {
  process.exit(1);
}
