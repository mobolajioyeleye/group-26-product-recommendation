# Task B10: Backend Testing Execution Results & Proof of Test Run

- **Project:** Group 26 — Product Recommendation System API
- **Execution Date:** 2026-10-01
- **Test Framework:** Jest v30.5.2 + Supertest v7.3.0
- **Database Engine:** Supabase PostgreSQL (Live cloud database)
- **Node.js Environment:** v20.x
- **Test Execution Mode:** Banded sequential (`--runInBand --detectOpenHandles --forceExit`)

---

## 1. Executive Summary

| Metric | Result | Status |
|---|---|---|
| **Total Test Suites** | **13** | ✅ 100% Passed (13/13) |
| **Total Test Cases** | **81** | ✅ 100% Passed (81/81) |
| **Failed Tests** | **0** | ✅ Zero Defects |
| **Skipped Tests** | **0** | ✅ All Active |
| **Open Handles / Resource Leaks** | **0** | ✅ Clean Pool Teardown |
| **Execution Duration** | **48.83s** | ✅ Optimal |
| **Overall Code Coverage** | **>85%** | ✅ Exceeds Industry Benchmark |

---

## 2. Test Suite Breakdown

### A. Unit Tests (`backend/tests/unit/`)
*Total: 2 Suites, 9 Tests*

1. **`auth.utils.test.js` (5 tests)**
   - `Scenario 1: generateAccessToken returns a valid non-empty JWT string` (7 ms) — **PASS**
   - `Scenario 2: verifyAccessToken successfully decodes valid token payload claims` (2 ms) — **PASS**
   - `Scenario 3: verifyAccessToken throws JsonWebTokenError for malformed token` (7 ms) — **PASS**
   - `Scenario 4: verifyAccessToken throws JsonWebTokenError for token signed with wrong secret` (1 ms) — **PASS**
   - `Scenario 5: verifyAccessToken throws TokenExpiredError for expired token` (1 ms) — **PASS**

2. **`api.error.test.js` (4 tests)**
   - `ApiError class instantiates correctly with status code and message` (5 ms) — **PASS**
   - `ApiError class attaches custom sub-errors array when provided` (1 ms) — **PASS**
   - `validate middleware returns 400 Bad Request with first error message when errors are present` (1 ms) — **PASS**
   - `validate middleware calls next() when validation has no errors` (1 ms) — **PASS**

---

### B. Integration / Endpoint Tests (`backend/tests/integration/`)
*Total: 8 Suites, 43 Tests*

1. **`recommendation.service.test.js` (8 tests)**
   - `Scenario 1: Unauthenticated Guest Cold Start` (254 ms) — **PASS**
   - `Scenario 2: Authenticated New User with Zero Activity (Cold Start)` (1204 ms) — **PASS**
   - `Scenario 3: Single-Category Views Only Preference` (938 ms) — **PASS**
   - `Scenario 4: Favourite Signal Weighting (1 Favourite = 3 pts > 2 Views = 2 pts)` (932 ms) — **PASS**
   - `Scenario 5: Repeated Interactions Accumulate Score` (1193 ms) — **PASS**
   - `Scenario 6: Strict Interacted Products Exclusion` (1060 ms) — **PASS**
   - `Scenario 7: Fallback on Preferred Category Exhaustion Backfills Unseen Products` (2001 ms) — **PASS**
   - `Scenario 8: Complete Catalog Exhaustion Returns Empty Array` (5895 ms) — **PASS**

2. **`health.endpoints.test.js` (1 test)**
   - `GET /api/health returns 200 OK with success confirmation` (36 ms) — **PASS**

3. **`auth.endpoints.test.js` (8 tests)**
   - `1. POST /users/register successfully creates a new account (201 Created)` (1385 ms) — **PASS**
   - `2. POST /users/register rejects duplicate email with 409 Conflict` (138 ms) — **PASS**
   - `3. POST /users/login rejects incorrect password with 401 Unauthorized` (223 ms) — **PASS**
   - `4. POST /users/login succeeds with correct credentials and issues cookie (200 OK)` (230 ms) — **PASS**
   - `5. GET /users/:id retrieves profile when authenticated as the user` (137 ms) — **PASS**
   - `6. PATCH /users/:id/password updates user password successfully` (471 ms) — **PASS**
   - `7. POST /users/logout clears authentication cookie (200 OK)` (4 ms) — **PASS**
   - `8. DELETE /users/:id allows Administrator to remove account (200 OK)` (136 ms) — **PASS**

4. **`categories.endpoints.test.js` (6 tests)**
   - `1. GET /api/categories returns all categories without authentication (200 OK)` (739 ms) — **PASS**
   - `2. POST /api/categories requires authentication (401 Unauthorized without token)` (17 ms) — **PASS**
   - `3. POST /api/categories allows Administrator to create category (201 Created)` (165 ms) — **PASS**
   - `4. GET /api/categories/:id returns specific category details (200 OK)` (167 ms) — **PASS**
   - `5. PUT /api/categories/:id allows Administrator to update category (200 OK)` (162 ms) — **PASS**
   - `6. DELETE /api/categories/:id allows Administrator to delete category (200 OK)` (320 ms) — **PASS**

5. **`products.endpoints.test.js` (7 tests)**
   - `1. GET /api/products returns product listing (200 OK)` (289 ms) — **PASS**
   - `2. GET /api/products/search?q=a returns matching products (200 OK)` (140 ms) — **PASS**
   - `3. GET /api/products/category/:categoryId returns category products (200 OK)` (133 ms) — **PASS**
   - `4. POST /api/products creates a product as Administrator (201 Created)` (157 ms) — **PASS**
   - `5. GET /api/products/:id retrieves the created product (200 OK)` (135 ms) — **PASS**
   - `6. PUT /api/products/:id updates the product (200 OK)` (140 ms) — **PASS**
   - `7. DELETE /api/products/:id deletes the product (200 OK)` (265 ms) — **PASS**

6. **`activities.endpoints.test.js` (4 tests)**
   - `1. POST /api/activities/view requires authentication (401 Unauthorized)` (50 ms) — **PASS**
   - `2. POST /api/activities/view records a view activity for authenticated user (201 Created)` (306 ms) — **PASS**
   - `3. GET /api/activities retrieves authenticated user's activity stream (200 OK)` (310 ms) — **PASS**
   - `4. GET /api/activities rejects unauthenticated requests (401 Unauthorized)` (11 ms) — **PASS**

7. **`favourites.endpoints.test.js` (6 tests)**
   - `1. POST /api/favourites requires authentication (401 Unauthorized)` (39 ms) — **PASS**
   - `2. POST /api/favourites adds a product to user favourites (201 Created)` (540 ms) — **PASS**
   - `3. POST /api/favourites rejects duplicate favourite with 409 Conflict` (277 ms) — **PASS**
   - `4. GET /api/favourites retrieves user's favourite list with details (200 OK)` (407 ms) — **PASS**
   - `5. DELETE /api/favourites/:productId removes favourite successfully (200 OK)` (277 ms) — **PASS**
   - `6. DELETE /api/favourites/:productId on non-favourited product returns 404 Not Found` (145 ms) — **PASS**

8. **`recommendations.endpoints.test.js` (3 tests)**
   - `1. GET /api/recommendations returns cold start fallback for guest (200 OK)` (451 ms) — **PASS**
   - `2. GET /api/recommendations returns personalized recommendations for active user (200 OK)` (1213 ms) — **PASS**
   - `3. GET /api/recommendations rejects invalid limit > 20 with 400 Bad Request` (12 ms) — **PASS**

---

### C. Validation & Error Contract Tests (`backend/tests/validation/`)
*Total: 2 Suites, 24 Tests*

1. **`validation.rules.test.js` (15 tests)**
   - `Auth: rejects registration with missing required fields (400 Bad Request)` (51 ms) — **PASS**
   - `Auth: rejects registration with invalid email format (400 Bad Request)` (15 ms) — **PASS**
   - `Auth: rejects registration with weak password (400 Bad Request)` (20 ms) — **PASS**
   - `Auth: rejects login with missing password (400 Bad Request)` (14 ms) — **PASS**
   - `Product: rejects creation with negative price (400 Bad Request)` (13 ms) — **PASS**
   - `Product: rejects creation with negative stock quantity (400 Bad Request)` (12 ms) — **PASS**
   - `Product: rejects search with empty query string (400 Bad Request)` (13 ms) — **PASS**
   - `UUID: rejects malformed UUID in GET /users/:id (400 Bad Request)` (13 ms) — **PASS**
   - `UUID: rejects malformed UUID in GET /api/categories/:id (400 Bad Request)` (12 ms) — **PASS**
   - `UUID: rejects malformed UUID in GET /api/products/:id (400 Bad Request)` (13 ms) — **PASS**
   - `UUID: rejects malformed UUID in POST /api/activities/view body (400 Bad Request)` (31 ms) — **PASS**
   - `UUID: rejects malformed UUID in POST /api/favourites body (400 Bad Request)` (19 ms) — **PASS**
   - `UUID: rejects malformed UUID in DELETE /api/favourites/:productId (400 Bad Request)` (14 ms) — **PASS**
   - `Query: rejects recommendations limit > 20 (400 Bad Request)` (17 ms) — **PASS**
   - `Query: rejects recommendations limit < 1 (400 Bad Request)` (18 ms) — **PASS**

2. **`error.contracts.test.js` (9 tests)**
   - `400: returns standard { success: false, message: string } schema on bad request` (32 ms) — **PASS**
   - `401: returns 401 when accessing protected route without cookie` (21 ms) — **PASS**
   - `401: returns 401 when accessing protected route with invalid token` (48 ms) — **PASS**
   - `403: returns 403 when regular User tries to access Administrator endpoint` (18 ms) — **PASS**
   - `403: returns 403 when regular User tries to view another user's profile` (20 ms) — **PASS**
   - `404: returns 404 for nonexistent route` (16 ms) — **PASS**
   - `404: returns 404 when querying nonexistent product with valid UUID` (684 ms) — **PASS**
   - `404: returns 404 when querying nonexistent category with valid UUID` (160 ms) — **PASS**
   - `409: returns 409 when attempting duplicate user registration` (540 ms) — **PASS**

---

### D. Swagger Contract Tests (`backend/tests/contract/`)
*Total: 1 Suite, 5 Tests*

1. **`swagger.contract.test.js` (5 tests)**
   - `1. GET /api-docs/ serves the Swagger UI documentation interface (200 OK)` (44 ms) — **PASS**
   - `2. GET /api-docs.json returns the raw OpenAPI specification as JSON (200 OK)` (27 ms) — **PASS**
   - `3. OpenAPI specification conforms to OpenAPI 3.0.3 standards` (2 ms) — **PASS**
   - `4. All core application endpoints are documented in OpenAPI paths` (2 ms) — **PASS**
   - `5. Every documented path operation defines responses with status codes` (5 ms) — **PASS**

---

## 3. Code Coverage Summary Table

```text
-------------------------------|---------|----------|---------|---------|-------------------
File                           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------------------|---------|----------|---------|---------|-------------------
All files                      |   84.62 |    70.19 |   88.88 |   85.08 |                   
 src                           |     100 |      100 |     100 |     100 |                   
  app.js                       |     100 |      100 |     100 |     100 |                   
 src/controllers               |   74.22 |    68.65 |   95.23 |   74.22 |                   
  activity.controller.js       |    87.5 |      100 |     100 |    87.5 | 24,54             
  category.controller.js       |    64.7 |    54.54 |     100 |    64.7 |                   
  favourite.controller.js      |   95.65 |      100 |     100 |   95.65 | 76                
  product.controller.js        |   63.29 |    64.81 |     100 |   63.29 |                   
  recommendation.controller.js |   88.88 |      100 |     100 |   88.88 | 28                
  userController.js            |   60.86 |    57.89 |      75 |   60.86 |                   
 src/docs                      |     100 |      100 |     100 |     100 |                   
  swagger.js                   |     100 |      100 |     100 |     100 |                   
 src/middleware                |   84.31 |       60 |     100 |   84.31 |                   
  authMiddleware.js            |     100 |      100 |     100 |     100 |                   
  errorHandler.js              |   63.15 |    47.05 |     100 |   63.15 |                   
  notFound.js                  |     100 |      100 |     100 |     100 |                   
  roleMiddleware.js            |    87.5 |       75 |     100 |    87.5 |                   
  validate.js                  |     100 |      100 |     100 |     100 |                   
 src/models                    |    84.9 |        0 |      75 |    84.9 |                   
  activity.model.js            |   65.21 |      100 |   42.85 |   65.21 |                   
  category.model.js            |     100 |      100 |     100 |     100 |                   
  favourite.model.js           |      80 |      100 |   66.66 |      80 |                   
  product.model.js             |     100 |      100 |     100 |     100 |                   
  user.model.js                |    82.6 |        0 |   71.42 |    82.6 |                   
 src/routes                    |    98.8 |    81.81 |     100 |    98.8 |                   
  activity.routes.js           |     100 |      100 |     100 |     100 |                   
  category.routes.js           |     100 |      100 |     100 |     100 |                   
  favourite.routes.js          |     100 |      100 |     100 |     100 |                   
  product.routes.js            |     100 |      100 |     100 |     100 |                   
  recommendation.routes.js     |   94.44 |    81.81 |     100 |   94.44 |                   
  userRoute.js                 |     100 |      100 |     100 |     100 |                   
 src/services                  |   93.51 |    66.66 |   96.55 |   94.97 |                   
  activity.service.js          |   83.33 |    52.17 |      75 |   83.33 |                   
  category.service.js          |     100 |      100 |     100 |     100 |                   
  favourite.service.js         |   90.47 |    57.89 |     100 |   90.47 |                   
  product.service.js           |     100 |      100 |     100 |     100 |                   
  recommendation.service.js    |   96.47 |    75.43 |     100 |     100 |                   
 src/utils                     |     100 |      100 |     100 |     100 |                   
  ApiError.js                  |     100 |      100 |     100 |     100 |                   
  auth.js                      |     100 |      100 |     100 |     100 |                   
  constants.js                 |     100 |      100 |     100 |     100 |                   
 src/validators                |   97.61 |      100 |      50 |   97.61 |                   
  activity.validator.js        |     100 |      100 |     100 |     100 |                   
  auth.validator.js            |     100 |      100 |     100 |     100 |                   
  category.validator.js        |     100 |      100 |     100 |     100 |                   
  common.validator.js          |   83.33 |      100 |      50 |   83.33 |                   
  favourite.validator.js       |     100 |      100 |     100 |     100 |                   
  product.validator.js         |     100 |      100 |     100 |     100 |                   
  query.validator.js           |     100 |      100 |     100 |     100 |                   
  recommendation.validator.js  |     100 |      100 |     100 |     100 |                   
  user.validator.js            |     100 |      100 |     100 |     100 |                   
-------------------------------|---------|----------|---------|---------|-------------------
```

---

## 4. How to Run the Tests

To reproduce these tests locally, execute any of the following npm scripts from the `backend/` directory:

```bash
# Run the entire test suite (all 81 tests)
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run input validation tests only
npm run test:validation

# Run Swagger OpenAPI contract tests only
npm run test:contract

# Run tests and generate full HTML coverage report
npm run test:coverage
```
