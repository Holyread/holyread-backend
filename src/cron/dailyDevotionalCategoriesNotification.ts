import { CronJob } from "cron";
import config from "../../config";
import { dailyDevotionalCategoriesNotification } from "../constants/cron.constants";
import {
      DailyDvotionalModel,
      UserModel,
      CronLogModel,
      NotificationsModel,
} from "../models";
import { pushNotification } from "../lib/utils/utils";

const start = async () => {
      try {
            console.log("JOB(🟢) Daily devotional categories Started successfully!");

            const cronLog = new CronLogModel({
                  jobName: "daily_devotional_notifier",
                  status: "running",
                  startedAt: new Date(),
            });
            await cronLog.save();

            const categoriesToCheck = ["Women", "Couple", "Parents"];
            let dailyDevotional = [];

            for (const category of categoriesToCheck) {
                  const unPublishDevotional = await DailyDvotionalModel.findOne({
                        publish: false,
                        category: category,
                  })
                        .select("_id title category")
                        .lean()
                        .exec();

                  if (unPublishDevotional) {
                        dailyDevotional.push(unPublishDevotional);
                  }
            }

            if (!dailyDevotional.length) {
                  console.log(
                        "JOB(🔴) Daily devotional execution stop due to no reads found"
                  );
                  return;
            }

            let publishDailyDevotional = [];
            if (dailyDevotional.length) {
                  publishDailyDevotional = await Promise.all(
                        dailyDevotional.map(async (item) => {
                              await DailyDvotionalModel.findOneAndUpdate(
                                    { _id: item?._id },
                                    { publish: true, publishedAt: new Date() }
                              );
                              return item;
                        })
                  );
            }

            // Get users eligible for notifications
            const users: any = await UserModel.find({
                  status: "Active",
                  timeZone: { $exists: true },
                  "pushTokens.0": { $exists: true },
                  "notification.dailyDevotional": true,
                  "notification.push": true,
                  $or: [
                        {
                              'inAppSubscription': { $exists: true },
                              'inAppSubscriptionStatus': 'Active',
                        },
                        {
                              'stripe': { $exists: true },
                              'stripe.status': 'active',
                        },
                  ],
            })
                  .select("pushTokens libraries timeZone")
                  .populate("libraries")
                  .lean()
                  .exec();

            if (!users.length) {
                  console.log(
                        "JOB(🔴) Daily devotional categories execution stop due to no users found"
                  );
                  return;
            }

            const usersWithCategories = users.filter(
                  (user) =>
                        user.libraries &&
                        user.libraries.devotionalCategories &&
                        user.libraries.devotionalCategories.length > 0
            );

            // Check if there are eligible users
            if (!usersWithCategories.length) {
                  console.log(
                        "JOB(🔴) Daily devotional categories execution stop due to no users found"
                  );
                  return;
            }

            // Iterate over each timezone
            let matchedSeries = [];
            try {
                  const tokenSet = new Set<string>();
                  usersWithCategories?.forEach((user) => {
                        publishDailyDevotional.forEach((devotional) => {
                              if (
                                    user.libraries.devotionalCategories.includes(
                                          devotional.category
                                    )
                              ) {
                                    matchedSeries.push(devotional.title);
                              }
                        });

                        const pushTokens = user.pushTokens;
                        if (pushTokens && Array.isArray(pushTokens)) {
                              pushTokens.forEach((token) => {
                                    tokenSet.add(token);
                              });
                        }
                  });

                  const tokens: string[] = Array.from(tokenSet);

                  // Send notifications to users in the timezone
                  const notificationPayload = {
                        title: "🔔 Your daily devotional!",
                        body: `📙 Your daily devotional for ${matchedSeries.join(" and ")} are available 🔖`
                  };

                  await pushNotification(
                        tokens,
                        notificationPayload.title,
                        notificationPayload.body
                  );

                  // Log notifications sent
                  tokens.forEach(async (token) => {
                        const notificationLog = new NotificationsModel({
                              userId: users[0]._id, // Assuming all users in the timezone are logged for simplicity
                              type: "user",
                              notification: {
                                    title: notificationPayload.title,
                                    description: notificationPayload.body,
                                    success: true,
                                    errorMessage: undefined,
                              },
                              createdAt: new Date(),
                        });
                        await notificationLog.save();
                  });
            } catch (error: any) {
                  console.log("Users processing error - ", error.message);
                  const notificationLog = new NotificationsModel({
                        userId: users[0]._id, // Assuming all users in the timezone are logged for simplicity
                        type: "user",
                        notification: {
                              title: "🔔 Your daily devotional!",
                              description: `📙 Your daily devotional for ${matchedSeries.join(" and ")} are available 🔖`,
                              success: true,
                              errorMessage: `Users processing error -', ${error.message}`,
                        },
                        createdAt: new Date(),
                  });
                  await notificationLog.save();
            }


            console.log("JOB(✅) Daily devotional categories executed successfully!");
            cronLog.status = "success";
            cronLog.endedAt = new Date();
            await cronLog.save();
      } catch (error: any) {
            console.log(
                  "JOB(🔴) Daily devotional categories execution Error is - ",
                  error.message
            );
            const cronLog = new CronLogModel({
                  jobName: "daily_devotional_notifier",
                  status: "failed",
                  endedAt: new Date(),
                  message: `daily devotional job failed: ${error.message}`,
            });
            await cronLog.save();
      }
};

((cronConfig, config) => {
      if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
            console.log(
                  `JOB(🟡) Daily devotional categories not initiated due to ${config.NODE_ENV} Environment`
            );
            return;
      }
      const schedule = Object.values(
            dailyDevotionalCategoriesNotification.SCHEDULE
      ).join(" ");
      new CronJob(
            schedule,
            () => {
                  start();
            },
            null,
            true
      );
      console.log("JOB(🟢) Daily devotional categories initiated successfully!");
})(dailyDevotionalCategoriesNotification, config);
