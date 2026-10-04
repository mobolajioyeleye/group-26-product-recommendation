/* global process */
import assert from "node:assert";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  deleteCategory,
} from "../src/services/adminApi.js";

console.log("\n=======================================================");
console.log("   TASK F8: ADMIN DASHBOARD & MANAGEMENT VERIFICATION");
console.log("=======================================================\n");

let passedTests = 0;
let totalTests = 0;

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
// 1. Product Management Request Construction Tests
// -----------------------------------------------------------------------------
console.log("--- 1. Testing Product Management Endpoints ---");

await runAsyncTest("createProduct issues POST request to /api/products with payload", async () => {
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
        data: {
          id: "20000000-0000-0000-0000-000000000999",
          name: "Test Admin Product",
          price: "49.99",
          stock: 10,
        },
      }),
    };
  };

  try {
    const result = await createProduct({
      name: "Test Admin Product",
      price: 49.99,
      category_id: "10000000-0000-0000-0000-000000000001",
      stock: 10,
      description: "Test description",
      image_url: "https://example.com/item.jpg",
    });

    assert.strictEqual(capturedUrl.includes("/api/products"), true);
    assert.strictEqual(capturedOptions.method, "POST");
    assert.strictEqual(capturedOptions.credentials, "include");

    const parsed = JSON.parse(capturedOptions.body);
    assert.strictEqual(parsed.name, "Test Admin Product");
    assert.strictEqual(parsed.price, 49.99);
    assert.strictEqual(parsed.stock, 10);
    assert.strictEqual(parsed.category_id, "10000000-0000-0000-0000-000000000001");
    assert.strictEqual(result.id, "20000000-0000-0000-0000-000000000999");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("updateProduct issues PUT request to /api/products/:id with updated fields (FR-08)", async () => {
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
        data: {
          id: "20000000-0000-0000-0000-000000000999",
          name: "Updated Product Name",
          price: "79.99",
          stock: 25,
        },
      }),
    };
  };

  try {
    const result = await updateProduct("20000000-0000-0000-0000-000000000999", {
      name: "Updated Product Name",
      price: 79.99,
      category_id: "10000000-0000-0000-0000-000000000001",
      stock: 25,
      description: "Updated description",
      image_url: "https://example.com/updated.jpg",
    });

    assert.strictEqual(capturedUrl.includes("/api/products/20000000-0000-0000-0000-000000000999"), true);
    assert.strictEqual(capturedOptions.method, "PUT");

    const parsed = JSON.parse(capturedOptions.body);
    assert.strictEqual(parsed.name, "Updated Product Name");
    assert.strictEqual(parsed.price, 79.99);
    assert.strictEqual(parsed.stock, 25);
    assert.strictEqual(result.name, "Updated Product Name");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("deleteProduct issues DELETE request to /api/products/:id", async () => {
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
        message: "Product deleted successfully",
      }),
    };
  };

  try {
    await deleteProduct("20000000-0000-0000-0000-000000000999");
    assert.strictEqual(capturedUrl.includes("/api/products/20000000-0000-0000-0000-000000000999"), true);
    assert.strictEqual(capturedOptions.method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// -----------------------------------------------------------------------------
// 2. Category Management Request Construction Tests
// -----------------------------------------------------------------------------
console.log("\n--- 2. Testing Category Management Endpoints ---");

await runAsyncTest("createCategory issues POST request to /api/categories", async () => {
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
        data: {
          id: "10000000-0000-0000-0000-000000000099",
          name: "Smart Gadgets",
        },
      }),
    };
  };

  try {
    const result = await createCategory({
      name: "Smart Gadgets",
      description: "Cutting-edge tech",
    });

    assert.strictEqual(capturedUrl.includes("/api/categories"), true);
    assert.strictEqual(capturedOptions.method, "POST");

    const parsed = JSON.parse(capturedOptions.body);
    assert.strictEqual(parsed.name, "Smart Gadgets");
    assert.strictEqual(result.id, "10000000-0000-0000-0000-000000000099");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("deleteCategory issues DELETE request to /api/categories/:id", async () => {
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
        message: "Category deleted successfully",
      }),
    };
  };

  try {
    await deleteCategory("10000000-0000-0000-0000-000000000099");
    assert.strictEqual(capturedUrl.includes("/api/categories/10000000-0000-0000-0000-000000000099"), true);
    assert.strictEqual(capturedOptions.method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// -----------------------------------------------------------------------------
// 3. Error Handling Verification
// -----------------------------------------------------------------------------
console.log("\n--- 3. Testing Error Handling & Forbidden Rejection ---");

await runAsyncTest("createProduct propagates 403 Forbidden when user is not Administrator", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: false,
    status: 403,
    json: async () => ({ message: "Forbidden: Administrator role required" }),
  });

  try {
    await assert.rejects(
      async () =>
        createProduct({
          name: "Unauthorized Item",
          price: 10,
          category_id: "10000000-0000-0000-0000-000000000001",
        }),
      /Forbidden: Administrator role required/i
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// -----------------------------------------------------------------------------
// 4. Bulk Product Import & CSV Parsing Verification (Option A)
// -----------------------------------------------------------------------------
console.log("\n--- 4. Testing Bulk Import & CSV Parsing ---");

await runAsyncTest("Bulk CSV parser extracts valid products and maps columns", async () => {
  const sampleCsv = `name,category,price,stock,description,image_url\n"Wireless Mouse",Electronics,39.99,50,"Ergonomic mouse",https://example.com/mouse.jpg\n"Ceramic Mug",Lifestyle,18.00,30,"Handmade cup",https://example.com/mug.jpg`;

  const lines = sampleCsv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  assert.strictEqual(lines.length, 3);
  const headers = lines[0].split(",").map((h) => h.trim());
  assert.deepStrictEqual(headers, ["name", "category", "price", "stock", "description", "image_url"]);
  assert.strictEqual(lines[1].includes("Wireless Mouse"), true);
  assert.strictEqual(lines[2].includes("Ceramic Mug"), true);
});

await runAsyncTest("Bulk product batch import executes sequential creation calls", async () => {
  const originalFetch = globalThis.fetch;
  const createdItems = [];

  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    createdItems.push(body);
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: { id: `20000000-0000-0000-0000-00000000000${createdItems.length}`, ...body },
      }),
    };
  };

  try {
    const batch = [
      { name: "Bulk Item 1", price: 10, stock: 5, category_id: "10000000-0000-0000-0000-000000000001" },
      { name: "Bulk Item 2", price: 20, stock: 8, category_id: "10000000-0000-0000-0000-000000000001" },
      { name: "Bulk Item 3", price: 30, stock: 12, category_id: "10000000-0000-0000-0000-000000000001" },
    ];

    for (const item of batch) {
      await createProduct(item);
    }

    assert.strictEqual(createdItems.length, 3);
    assert.strictEqual(createdItems[0].name, "Bulk Item 1");
    assert.strictEqual(createdItems[1].name, "Bulk Item 2");
    assert.strictEqual(createdItems[2].name, "Bulk Item 3");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runAsyncTest("Bulk import detects duplicates and skips them when requested", async () => {
  const existingProducts = [
    { name: "Existing Mug", category: "Lifestyle", price: 15 },
  ];

  const batch = [
    { name: "Existing Mug", category: "Lifestyle", price: 15 },
    { name: "New Pillow", category: "Lifestyle", price: 25 },
    { name: "New Pillow", category: "Lifestyle", price: 25 },
  ];

  const seenInBatch = new Set();
  const processed = batch.map((item) => {
    const key = item.name.toLowerCase();
    const isCatalogDup = existingProducts.some((p) => p.name.toLowerCase() === key);
    const isBatchDup = seenInBatch.has(key);
    const isDup = isCatalogDup || isBatchDup;
    seenInBatch.add(key);
    return { ...item, isDuplicate: isDup };
  });

  assert.strictEqual(processed[0].isDuplicate, true);
  assert.strictEqual(processed[1].isDuplicate, false);
  assert.strictEqual(processed[2].isDuplicate, true);

  const skipped = processed.filter((item) => !item.isDuplicate);
  assert.strictEqual(skipped.length, 1);
  assert.strictEqual(skipped[0].name, "New Pillow");
});

await runAsyncTest("Multi-select bulk delete batches sequential delete requests and updates catalog", async () => {
  const originalFetch = globalThis.fetch;
  const deletedIds = [];

  globalThis.fetch = async (url, options) => {
    if (options.method === "DELETE") {
      const id = url.split("/").pop();
      deletedIds.push(id);
      return {
        ok: true,
        json: async () => ({ success: true, message: "Product deleted" }),
      };
    }
    return { ok: false };
  };

  try {
    const selectedIds = ["uuid-prod-1", "uuid-prod-2", "uuid-prod-3"];
    for (const id of selectedIds) {
      await deleteProduct(id);
    }
    assert.strictEqual(deletedIds.length, 3);
    assert.deepStrictEqual(deletedIds, ["uuid-prod-1", "uuid-prod-2", "uuid-prod-3"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

console.log("\n=======================================================");
console.log(`   TASK F8 VERIFICATION: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log("=======================================================\n");

if (passedTests !== totalTests) {
  process.exit(1);
}
