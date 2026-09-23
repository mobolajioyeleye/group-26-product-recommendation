const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Invalid JSON/body parsing
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON request body";
  }

  // PostgreSQL unique constraint violation
  if (err.code === "23505") {
    statusCode = 409;
    message = "Resource already exists";
  }

  // PostgreSQL foreign key constraint violation
  if (err.code === "23503") {
    statusCode = 400;
    message = "Invalid related resource";
  }

  const response = {
    success: false,
    message,
  };

  // Include validation details when available
  if (err.errors) {
    response.errors = err.errors;
  }

  // Don't expose stack traces in production
  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
