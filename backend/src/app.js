const express = require("express");
const cors = require("cors");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Common middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Group 26 API is running",
  });
});

// B8 - Error handling middleware
// Keep these after all API routes
app.use(notFound);
app.use(errorHandler);

module.exports = app;
