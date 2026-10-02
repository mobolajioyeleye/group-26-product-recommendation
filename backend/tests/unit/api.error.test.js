const ApiError = require("../../src/utils/ApiError");

jest.mock("express-validator", () => ({
  validationResult: jest.fn(),
}));

const { validationResult } = require("express-validator");
const validate = require("../../src/middleware/validate");

describe("Unit Tests: ApiError Utility & Validate Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ApiError class", () => {
    test("instantiates correctly with status code and message", () => {
      const error = new ApiError(404, "Product not found");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Product not found");
      expect(error.errors).toBeNull();
      expect(error.isOperational).toBe(true);
    });

    test("attaches custom sub-errors array when provided", () => {
      const subErrors = ["Invalid field 'price'", "Invalid field 'stock'"];
      const error = new ApiError(400, "Validation failed", subErrors);
      expect(error.statusCode).toBe(400);
      expect(error.errors).toEqual(subErrors);
    });
  });

  describe("validate middleware", () => {
    test("returns 400 Bad Request with first error message when errors are present", () => {
      const mockReq = {};
      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockRes = { status: mockStatus };
      const mockNext = jest.fn();

      validationResult.mockReturnValueOnce({
        isEmpty: () => false,
        array: () => [
          { msg: "Price must be a positive number" },
          { msg: "Stock quantity cannot be negative" },
        ],
      });

      validate(mockReq, mockRes, mockNext);

      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const calledWithError = mockNext.mock.calls[0][0];
      expect(calledWithError).toBeInstanceOf(ApiError);
      expect(calledWithError.statusCode).toBe(400);
      expect(calledWithError.message).toBe("Price must be a positive number");
    });

    test("calls next() when validation has no errors", () => {
      const mockReq = {};
      const mockRes = { status: jest.fn() };
      const mockNext = jest.fn();

      validationResult.mockReturnValueOnce({
        isEmpty: () => true,
        array: () => [],
      });

      validate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
