const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const router = express.Router();

// Route 1: Downloadable / Viewable OpenAPI 3.0.3 JSON Specification
router.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(swaggerDocument);
});

// Route 2: Interactive Swagger UI
router.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "Group 26 - Product Recommendation API Docs",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
  })
);

module.exports = {
  router,
  swaggerDocument,
};
