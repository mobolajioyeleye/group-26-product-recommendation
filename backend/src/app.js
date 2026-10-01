const express = require("express");
const cors = require("cors");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const userRoutes = require("./routes/userRoute");
const cookieParser = require("cookie-parser");

const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const activityRoutes = require("./routes/activity.routes");
const favouriteRoutes = require("./routes/favourite.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const { router: swaggerRouter } = require("./docs/swagger");

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

// User routes
app.use("/users", userRoutes);

// B5 - Category routes
app.use("/api/categories", categoryRoutes);

// B5 - Product routes
app.use("/api/products", productRoutes);

// B6 - Activity routes
app.use("/api/activities", activityRoutes);

// B6 - Favourite routes
app.use("/api/favourites", favouriteRoutes);

// B7 - Recommendation routes
app.use("/api/recommendations", recommendationRoutes);

// B10 - Swagger documentation & OpenAPI JSON specification
app.use(swaggerRouter);

// B8 - Error handling middleware
// Keep these after all API routes
app.use(notFound);
app.use(errorHandler);

module.exports = app;
