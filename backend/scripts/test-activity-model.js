const {
  createActivity,
  getAllActivities,
  getActivityById,
  getActivitiesByUser,
  getActivitiesByProduct,
  getUserProductActivities,
  deleteActivity,
} = require("../src/models/activity.model");

const pool = require("../src/config/database");

const testActivityModel = async () => {
  let activityId;
  let userId;
  let productId;

  try {
    console.log("\nTesting getAllActivities...");
    const activities = await getAllActivities();
    console.log(`Activities found: ${activities.length}`);

    userId = activities[0].user_id;
    productId = activities[0].product_id;

    console.log("\nTesting getActivityById...");
    const activity = await getActivityById(activities[0].id);
    console.log(activity);

    console.log("\nTesting getActivitiesByUser...");
    const userActivities = await getActivitiesByUser(userId);
    console.log(`Activities for user: ${userActivities.length}`);

    console.log("\nTesting getActivitiesByProduct...");
    const productActivities = await getActivitiesByProduct(productId);
    console.log(`Activities for product: ${productActivities.length}`);

    console.log("\nTesting getUserProductActivities...");
    const userProductActivities = await getUserProductActivities(
      userId,
      productId
    );
    console.log(
      `Activities for user/product: ${userProductActivities.length}`
    );

    console.log("\nTesting createActivity...");
    const newActivity = await createActivity(
      userId,
      productId,
      "VIEW"
    );

    activityId = newActivity.id;
    console.log(newActivity);

    console.log("\nTesting deleteActivity...");
    const deletedActivity = await deleteActivity(activityId);
    console.log(deletedActivity);

    console.log("\nAll activity model tests passed.");
  } catch (error) {
    console.error("\nActivity model test failed:", error.message);
  } finally {
    await pool.end();
  }
};

testActivityModel();