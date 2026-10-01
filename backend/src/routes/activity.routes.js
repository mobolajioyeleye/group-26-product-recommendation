const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activity.controller");
const { authenticate } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { recordViewValidator } = require("../validators/activity.validator");

// POST /api/activities/view - Record a product view
router.post(
  "/view",
  authenticate,
  recordViewValidator,
  validate,
  activityController.recordView
);

// GET /api/activities - Retrieve authenticated user's activity history
router.get("/", authenticate, activityController.getUserActivities);

module.exports = router;
