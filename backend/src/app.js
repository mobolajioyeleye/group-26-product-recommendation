const express = require("express");
const cors = require("cors");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const userRoutes = require("./routes/userRoute");
const cookieParser = require("cookie-parser");

const app = express();

// Common middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Group 26 API is running",
  });
});

// userRoute
app.use("/users", userRoutes);

// Task B6 API Routes
app.use("/api/activities", require("./routes/activity.routes"));
app.use("/api/favourites", require("./routes/favourite.routes"));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
