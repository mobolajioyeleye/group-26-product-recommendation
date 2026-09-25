const express = require("express");

const router = express.Router();

const validateRequest = require("../middleware/validation.middleware");

const {
  validateCreateActivity,
  validateActivityId,
  validateActivitiesByUser,
  validateActivitiesByProduct,
  validateUserProductActivities,
} = require("../validators/activity.validator");

const activityController = require("../controllers/activity.controller");

router.post(
  "/",
  validateCreateActivity,
  validateRequest,
  activityController.createActivity
);

router.get(
  "/",
  activityController.getAllActivities
);

router.get(
  "/:id",
  validateActivityId,
  validateRequest,
  activityController.getActivityById
);

router.get(
  "/user/:userId",
  validateActivitiesByUser,
  validateRequest,
  activityController.getActivitiesByUser
);

router.get(
  "/product/:productId",
  validateActivitiesByProduct,
  validateRequest,
  activityController.getActivitiesByProduct
);

router.get(
  "/user/:userId/product/:productId",
  validateUserProductActivities,
  validateRequest,
  activityController.getUserProductActivities
);

router.delete(
  "/:id",
  validateActivityId,
  validateRequest,
  activityController.deleteActivity
);

module.exports = router;