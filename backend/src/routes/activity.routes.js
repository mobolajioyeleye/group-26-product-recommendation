const express = require("express");

const router = express.Router();

const {
  createActivityValidator,
  activityIdValidator,
  activitiesByUserValidator,
  activitiesByProductValidator,
  userProductActivityValidator,
} = require("../validators/activity.validator");

const validateRequest = require("../middleware/validation.middleware");

const activityController = require("../controllers/activity.controller");

// Create activity
router.post(
  "/",
  createActivityValidator,
  validateRequest,
  activityController.createActivity
);

// Get all activities
router.get(
  "/",
  activityController.getAllActivities
);

// Get activity by ID
router.get(
  "/:id",
  activityIdValidator,
  validateRequest,
  activityController.getActivityById
);

// Get activities by user
router.get(
  "/user/:userId",
  activitiesByUserValidator,
  validateRequest,
  activityController.getActivitiesByUser
);

// Get activities by product
router.get(
  "/product/:productId",
  activitiesByProductValidator,
  validateRequest,
  activityController.getActivitiesByProduct
);

// Get activities by user and product
router.get(
  "/user/:userId/product/:productId",
  userProductActivityValidator,
  validateRequest,
  activityController.getUserProductActivities
);

// Delete activity
router.delete(
  "/:id",
  activityIdValidator,
  validateRequest,
  activityController.deleteActivity
);

module.exports = router;
