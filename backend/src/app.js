const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const { allowedOrigins, validateEnv } = require("./config/env");
const { apiLimiter } = require("./middleware/rateLimiter");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const userRoutes = require("./routes/userRoute");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const activityRoutes = require("./routes/activity.routes");
const favouriteRoutes = require("./routes/favourite.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const { router: swaggerRouter } = require("./docs/swagger");

// Validate critical secrets/environment variables at initialization
validateEnv();

const app = express();

// Security HTTP headers via Helmet
app.use(helmet());

// Allow the deployed Render URL so Swagger UI can call the API
const swaggerOrigin =
  "https://group-26-product-recommendation.onrender.com";

// Hardened CORS configuration with credentials support
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server requests)
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured frontend origins and the deployed Swagger origin
      if (allowedOrigins.includes(origin) || origin === swaggerOrigin) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS policy does not allow access from this origin")
      );
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// Payload size limit to prevent denial of service (DoS) via large payloads
app.use(express.json({ limit: "10kb" }));

app.use(cookieParser());

// General API rate limiter for /api routes
app.use("/api", apiLimiter);

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