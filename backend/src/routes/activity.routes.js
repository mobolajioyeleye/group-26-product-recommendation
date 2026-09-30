const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activity.controller");
const { authenticate } = require("../middleware/authMiddleware");

// POST /api/activities/view - Record a product view
router.post("/view", authenticate, activityController.recordView);

// GET /api/activities - Retrieve authenticated user's activity history
router.get("/", authenticate, activityController.getUserActivities);

module.exports = router;
