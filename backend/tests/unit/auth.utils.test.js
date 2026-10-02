const jwt = require("jsonwebtoken");
const { generateAccessToken, verifyAccessToken } = require("../../src/utils/auth");

describe("Unit Tests: Auth Utilities (src/utils/auth.js)", () => {
  const mockUser = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    email: "testuser@group26.com",
    role: "User",
  };

  test("Scenario 1: generateAccessToken returns a valid non-empty JWT string", () => {
    const token = generateAccessToken(mockUser);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  test("Scenario 2: verifyAccessToken successfully decodes valid token payload claims", () => {
    const token = generateAccessToken(mockUser);
    const decoded = verifyAccessToken(token);

    expect(decoded.id).toBe(mockUser.id);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.role).toBe(mockUser.role);
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
  });

  test("Scenario 3: verifyAccessToken throws JsonWebTokenError for malformed token", () => {
    const malformedToken = "invalid.token.structure";
    expect(() => {
      verifyAccessToken(malformedToken);
    }).toThrow(jwt.JsonWebTokenError);
  });

  test("Scenario 4: verifyAccessToken throws JsonWebTokenError for token signed with wrong secret", () => {
    const bogusToken = jwt.sign(mockUser, "wrong-secret-key-12345", { expiresIn: "1h" });
    expect(() => {
      verifyAccessToken(bogusToken);
    }).toThrow(jwt.JsonWebTokenError);
  });

  test("Scenario 5: verifyAccessToken throws TokenExpiredError for expired token", () => {
    const expiredToken = jwt.sign(mockUser, process.env.JWT_SECRET || "fallback_secret", {
      expiresIn: "-1s",
    });
    expect(() => {
      verifyAccessToken(expiredToken);
    }).toThrow(jwt.TokenExpiredError);
  });
});
