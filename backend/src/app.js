const express = require("express");
const cors = require("cors");

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

module.exports = app;