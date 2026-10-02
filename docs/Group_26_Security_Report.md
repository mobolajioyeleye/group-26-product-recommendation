# Group 26 — Backend Security & Threat Mitigation Report

**Task Reference:** Task B9 — Security  
**Product:** Product Recommendation System API (MVP)  
**Date:** October 2026  
**Document Author:** Group 26 Backend Engineering & Security Team  
**Status:** Completed & Validated (100% Security Pass Rate)

---

## 1. Executive Summary

This document details the security architecture, threat model, and vulnerability mitigation implemented for the Group 26 Product Recommendation System under **Task B9 (Security)**. 

The security implementation adheres strictly to the project's Product Requirements Document (PRD), addressing **NFR-04 (Security)**, **NFR-05 (Validation)**, **NFR-06 (Error Handling)**, and **FR-04 (Role-Based Authorization)**. The backend platform has been hardened using defense-in-depth principles, automated secret validation, robust password hashing, strict cookie-based session management, fine-grained access control, security HTTP headers, and rate limiting.

### Summary Metrics

| Dimension | Target / Requirement | Result Achieved | Verdict |
|---|---|---|---|
| **Security Test Suite** | Automated verification of all security controls | **19 automated tests** | ✅ Complete |
| **Pass Rate** | 100% test success | **100% (19/19 passing)** | ✅ Verified |
| **Password Hashing** | Bcrypt with cost factor ≥ 10 | **Bcrypt salt rounds: 10** | ✅ Secure |
| **Token Transmission** | Protection against XSS & CSRF | **HttpOnly, SameSite: Lax cookies** | ✅ Hardened |
| **Security Headers** | Industry-standard HTTP headers | **Helmet integrated** | ✅ Active |
| **Brute-Force Protection** | Rate limiting on sensitive auth endpoints | **Express-rate-limit active (429)** | ✅ Enforced |
| **Credential Leakage** | Zero password/hash exposure in API responses | **Explicit column selection & sanitization** | ✅ Clean |

---

## 2. Security Architecture & Threat Mitigation (Defense-in-Depth)

The security implementation is structured across six defensive layers:

```
+--------------------------------------------------------------------------+
| 1. Perimeter Defense: Helmet (HTTP Headers), CORS Whitelist, Rate Limiting |
+--------------------------------------------------------------------------+
                                     │
                                     ▼
+--------------------------------------------------------------------------+
| 2. Input & Transport Defense: 10KB Body Limit, Validation Middleware      |
+--------------------------------------------------------------------------+
                                     │
                                     ▼
+--------------------------------------------------------------------------+
| 3. Authentication: JWT in HttpOnly Cookies, Expired/Malformed Detection  |
+--------------------------------------------------------------------------+
                                     │
                                     ▼
+--------------------------------------------------------------------------+
| 4. Authorization: Role-Based (Administrator) & IDOR Resource Ownership   |
+--------------------------------------------------------------------------+
                                     │
                                     ▼
+--------------------------------------------------------------------------+
| 5. Data & Storage: Bcrypt (10 rounds), Strict Column Whitelisting        |
+--------------------------------------------------------------------------+
                                     │
                                     ▼
+--------------------------------------------------------------------------+
| 6. Environment & Error Security: Secret Validation, 500 Sanitization      |
+--------------------------------------------------------------------------+
```

---

### Layer 1: Perimeter Defense & Network Hardening

1. **Helmet HTTP Headers (`helmet`):**
   - Injected across all incoming HTTP traffic in `src/app.js`.
   - `X-Content-Type-Options: nosniff` — Prevents MIME-type sniffing attacks.
   - `X-Frame-Options: SAMEORIGIN` — Defends against clickjacking attacks by forbidding external iframe embeds.
   - `X-DNS-Prefetch-Control: off` — Restricts speculative DNS resolution.
   - `Cross-Origin-Opener-Policy` & `Cross-Origin-Resource-Policy` — Protects document isolation.

2. **CORS Control:**
   - Whitelists explicit frontend origins (e.g. `http://localhost:5173` for Vite development, production frontend domain) rather than open wildcards.
   - Permits secure credentials exchange (`Access-Control-Allow-Credentials: true`) necessary for HttpOnly cookie authorization.

3. **Brute-Force & Denial-of-Service Defense (`express-rate-limit`):**
   - **Authentication Limiter (`authLimiter`):** Mounted on `/users/login` and `/users/register`. Limits requests to 10 attempts per 15-minute window per IP in production to stop credential stuffing and account enumeration.
   - **API Traffic Limiter (`apiLimiter`):** Mounted on `/api` routes to throttle aggressive scrapers or automated query spam.
   - Exceeded thresholds return standardized `429 Too Many Requests` responses:
     ```json
     {
       "success": false,
       "message": "Too many authentication attempts, please try again after 15 minutes"
     }
     ```

---

### Layer 2: Input & Transport Security

1. **Request Body Size Restrictions:**
   - Express body-parser is configured with a strict `10kb` limit (`express.json({ limit: "10kb" })`).
   - Prevents denial-of-service attempts that flood the server with massive request payloads.
2. **Schema & Boundary Validation (B4 Pipeline):**
   - All routes run express-validator chains followed by centralized `validate` middleware.
   - Requests with missing fields, malformed UUIDs, or invalid data types are rejected with `400 Bad Request` before reaching application controllers or database drivers.

---

### Layer 3: Authentication Security

1. **Password Hashing:**
   - All user passwords are encrypted with `bcryptjs` using a work factor of 10 rounds (`bcrypt.hash(password, 10)`).
   - Plaintext passwords are never stored in the database or logged in application transcripts.
2. **Session Tokens via HttpOnly Cookies:**
   - Access tokens are transmitted exclusively in `httpOnly` cookies named `accessToken`.
   - `httpOnly: true` guarantees that client-side scripts (JavaScript / XSS payloads) cannot access or exfiltrate the JWT.
   - `sameSite: "lax"` protects against Cross-Site Request Forgery (CSRF).
   - `secure: true` automatically enables HTTPS-only transmission when deployed in `NODE_ENV=production`.
3. **Token Integrity & Error Differentiation:**
   - In alignment with Task B8, native JWT errors are forwarded directly to the central error handler.
   - Expired tokens explicitly return `"Authentication token has expired"` (401).
   - Forged or tampered tokens return `"Invalid authentication token"` (401).
   - Missing tokens return `"Authentication required"` (401).
4. **User Enumeration Prevention:**
   - Failed logins return a generic message: `"Invalid email or password"`.
   - Prevents attackers from discovering whether an email exists in the database.

---

### Layer 4: Role-Based Authorization & IDOR Defense

1. **Role-Based Access Control (RBAC):**
   - The platform strictly recognizes two roles: `User` and `Administrator`.
   - All administrative actions require valid authentication followed by `authorize("Administrator")`:
     - `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
     - `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`
     - `GET /users`, `PUT /users/:id`, `DELETE /users/:id`
   - Non-administrators attempting access receive `403 Forbidden` (`"You are not authorized to perform this action"`).
2. **Horizontal Privilege Separation (Insecure Direct Object Reference Defense):**
   - In `userController.js`, user-specific endpoints (`GET /users/:id`, `PATCH /users/:id/password`) verify that `req.user.id === id || req.user.role === 'Administrator'`.
   - A regular user attempting to view or change another user's password receives `403 Forbidden` (`"You are not authorized to view this user"` / `"You are not authorized to change this user's password"`).

---

### Layer 5: Data Storage & Credential Leakage Prevention

1. **SQL Column Whitelisting:**
   - User database queries (`createUser`, `getAllUsers`, `getUserById`, `updateUser`, `updateUserPassword`) use explicit `SELECT` and `RETURNING` clauses:
     ```sql
     SELECT id, name, email, role, created_at FROM users ...
     ```
   - The `password` hash is never selected or passed into standard query rows.
2. **Response Sanitization:**
   - Login and registration controllers explicitly construct client response payloads containing only `id`, `name`, `email`, and `role`.

---

### Layer 6: Secrets & Error Sanitization

1. **Secret Isolation:**
   - Root `.gitignore` strictly excludes `.env` and `.env.*` files.
   - Sanitized `.env.example` templates are provided at the project root and in `backend/` with dummy placeholders.
2. **Startup Environment Validation (`src/config/env.js`):**
   - Verifies presence of critical environment variables (`DATABASE_URL`, `JWT_SECRET`) upon server boot.
   - In production, missing secrets trigger an immediate fatal startup error to prevent unsafe default fallbacks.
3. **Error Stack Sanitization:**
   - The central error handler (`errorHandler.js`) strips stack traces in non-development environments and masks unexpected database exceptions behind a sanitized `"Internal server error"` response.

---

## 3. OWASP Top 10 Mitigation Matrix

| OWASP Vulnerability | Risk Assessment | Group 26 Mitigation Mechanism |
|---|---|---|
| **A01: Broken Access Control** | High | `authorize("Administrator")` middleware on admin CRUD; IDOR ownership validation on user profile and password change endpoints. |
| **A02: Cryptographic Failures** | Critical | Bcrypt salt rounds (10); JWT stored in HttpOnly, SameSite cookies; zero password leakage in models and controllers. |
| **A03: Injection (SQL / NoSQL)** | High | Parametrized PostgreSQL queries (`$1, $2, ...`) via `pg` library; RFC 4122 UUID validation via express-validator. |
| **A04: Insecure Design** | Medium | Defense-in-depth architecture; strict rate limiting on auth endpoints; standardized error contract. |
| **A05: Security Misconfiguration** | High | Helmet security headers; hardened CORS origin whitelisting; startup environment variable checks; sanitized `.env.example`. |
| **A06: Vulnerable & Outdated Components** | Medium | Dependencies audited with `npm audit` (0 vulnerabilities found). |
| **A07: Identification & Auth Failures** | High | Brute-force rate limiting; generic login failure messages; strict JWT expiration enforcement. |
| **A08: Software & Data Integrity Failures** | Medium | Input validation on all incoming request bodies and query parameters; body size cap (10KB). |
| **A09: Security Logging & Monitoring Failures** | Medium | Server-side error logging for 500s; activity tracking for user events. |
| **A10: Server-Side Request Forgery (SSRF)** | Low | No user-supplied URLs fetched server-side. |

---

## 4. Automated Security Test Suite Verification

A dedicated security verification suite was implemented in `backend/scripts/test-security.js` and registered in `package.json` under `npm run test:security`.

### Test Execution Summary (19 / 19 Tests Passed - 100%)

```
=======================================================
   TASK B9: SECURITY & SYSTEM HARDENING VERIFICATION
=======================================================

--- 1. Testing Security Headers (Helmet Hardening) ---
  ✅ [PASS] Helmet sets X-Content-Type-Options: nosniff header
  ✅ [PASS] Helmet sets X-Frame-Options to protect against clickjacking
  ✅ [PASS] Helmet sets X-DNS-Prefetch-Control or Cross-Origin policies

--- 2. Testing CORS & Transport Controls ---
  ✅ [PASS] CORS supports credentials on authenticated origins
  ✅ [PASS] Preflight OPTIONS request returns allowed security methods

--- 3. Testing Authentication Security & Token Verification ---
  ✅ [PASS] Protected endpoint rejects request missing authentication cookie (401)
  ✅ [PASS] Protected endpoint rejects forged / malformed JWT token (401)
  ✅ [PASS] Protected endpoint rejects token signed with illegitimate secret (401)
  ✅ [PASS] Protected endpoint rejects expired token (401)
  ✅ [PASS] Login with invalid credentials returns generic 401 (prevents user enumeration)

--- 4. Testing Role-Based Access Control (RBAC) ---
  ✅ [PASS] Regular User is forbidden from creating products (403)
  ✅ [PASS] Regular User is forbidden from creating categories (403)
  ✅ [PASS] Regular User is forbidden from listing all user accounts (403)
  ✅ [PASS] Regular User is forbidden from administrative deletion of users (403)

--- 5. Testing Horizontal Privilege Separation (IDOR Defense) ---
  ✅ [PASS] Regular User cannot view another user's profile by ID (403 Forbidden)
  ✅ [PASS] Regular User cannot change another user's password (403 Forbidden)

--- 6. Testing Data Leakage & Password Protection ---
  ✅ [PASS] Server suppresses stack traces and internal errors in production/test
  ✅ [PASS] Oversized request body is rejected to prevent payload flooding (DoS)

--- 7. Testing Rate Limiting (Brute-Force Attack Defense) ---
  ✅ [PASS] Rate limiter middleware is active and enforces 429 when threshold exceeded

=======================================================
   TASK B9 SECURITY SUMMARY: 19/19 TESTS PASSED (100%)
=======================================================
```

---

## 5. How to Run Security Tests Locally

From the `backend/` directory, run:

```bash
# Run automated security verification suite (19 tests)
npm run test:security

# Run complete Jest test suite (81 tests)
npm test

# Run error handling and API standards verification suite (26 tests)
npm run test:errors
```

---

## 6. Security Sign-Off

The security implementations completed under **Task B9** satisfy all security-related specifications in the Group 26 PRD:
- **Secrets Management:** ✅ Fully isolated and templated.
- **Authentication Security:** ✅ Bcrypt + HttpOnly cookies + JWT expiration.
- **Authorization & Access Control:** ✅ RBAC enforced across all admin routes + IDOR protection.
- **System Hardening:** ✅ Helmet + CORS whitelist + Rate limiting + 10KB body limit.
- **Automated Verification:** ✅ 19/19 security tests passing with zero regressions in existing test suites.

**Recommendation:** Task B9 is complete, verified, and ready for team review and integration.
