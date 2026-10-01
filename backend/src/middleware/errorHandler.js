/**
 * Centralized Error Handling Middleware for Express.
 * Catches all operational errors, database constraint exceptions,
 * authentication/JWT errors, and unhandled system exceptions.
 * Ensures consistent error response format: { success: false, message: string, errors?: array }
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = err.errors || null;

  // 1. Invalid JSON body parsing (Express body-parser SyntaxError)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON request body";
  }

  // 2. PostgreSQL unique constraint violation (Code 23505)
  if (err.code === "23505") {
    statusCode = 409;
    message = "Resource already exists";
  }

  // 3. PostgreSQL foreign key constraint violation (Code 23503)
  if (err.code === "23503") {
    statusCode = 400;
    message = "Invalid related resource";
  }

  // 4. PostgreSQL invalid text representation / syntax (Code 22P02)
  if (err.code === "22P02") {
    statusCode = 400;
    message = "Invalid input syntax or identifier format";
  }

  // 5. PostgreSQL not-null constraint violation (Code 23502)
  if (err.code === "23502") {
    statusCode = 400;
    message = "Missing required database field";
  }

  // 6. JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired";
  }

  // 7. Sanitize non-operational 500 server errors
  if (statusCode >= 500 && !err.isOperational) {
    message = "Internal server error";
  }

  // Log unhandled server errors (500s) for monitoring & debugging
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl} -`, err);
  }

  // Unified API Error Response
  const response = {
    success: false,
    message,
  };

  // Include field-level validation details when available
  if (errors) {
    response.errors = errors;
  }

  // Expose stack trace only in explicit development environment
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
