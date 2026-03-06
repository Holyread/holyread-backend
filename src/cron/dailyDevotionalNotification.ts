import { CronJob } from 'cron';
import config from '../../config';
import { DailyDvotionalModel, SettingModel, UserModel, CronLogModel, NotificationsModel, CronScheduleModel } from '../models';
import { groupByKey, pushNotification } from '../lib/utils/utils';
import { awsBucket, cronDirectory } from '../constants/app.constant';
import { getNotificationTemplate } from '../lib/helpers/notificationTemplate.helper';
import { NOTIFICATION_TEMPLATE, NOTIFICATION_TEMPLATE_FALLBACKS } from '../constants/notificationTemplate.constant';

const start = async () => {
      try {
            console.log('JOB(🟢) Daily devotional Started successfully!');

            const cronLog = new CronLogModel({
                  jobName: 'daily_devotional_notifier',
                  status: 'running',
                  startedAt: new Date(),
            });
            await cronLog.save();

            // Execution Logic
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);

            /** Get daily devotional */
            const dailyDevotional = await DailyDvotionalModel.findOne({
                  publishedAt: { $gte: new Date(start), $lte: new Date(end) },
                  category: { $exists: false },
            }).select('title description image').lean().exec();

            // Check if daily devotional exists
            if (!dailyDevotional) {
                  console.log('JOB(🔴) Daily devotional execution stop due to no reads found');
                  return;
            }

            // Get users eligible for notifications
            const users: any = await UserModel.find({
                  status: 'Active',
                  timeZone: { $exists: true },
                  'pushTokens.0': { '$exists': true },
                  'notification.dailyDevotional': true,
                  'notification.push': true,
                  // $or: [
                  //       {
                  //             'inAppSubscription': { $exists: true },
                  //             'inAppSubscriptionStatus': 'Active',
                  //       },
                  //       {
                  //             'stripe': { $exists: true },
                  //             'stripe.status': 'active',
                  //       },
                  // ],
            }).select('timeZone pushTokens libraries language').populate('libraries').lean().exec()

            const usersWithOutSubscribeCategories = users.filter(user =>
                  user.libraries &&                                // Check if libraries exist
                  user.libraries.devotionalCategories &&          // Check if devotionalCategories exist
                  user.libraries.devotionalCategories.length === 0 // Check if devotionalCategories array is empty
            );

            // Check if there are eligible users
            if (!usersWithOutSubscribeCategories.length) {
                  console.log('JOB(🔴) Daily devotional execution stop due to no users found');
                  return;
            }

            // Group users by timezone
            const result = groupByKey(usersWithOutSubscribeCategories, 'timeZone');
            const setting = await SettingModel.findOne({}).select('dailyDevotionalTime').lean().exec();

            // Iterate over each timezone
            Object.keys(result).map(async timeZone => {
                  try {
                        const dateStr = new Date().toLocaleString('en-US', { timeZone });
                        const timeValues = dateStr.split(', ')[1];
                        const time = timeValues.split(' ');
                        const [hours, minutes] = time[0].split(':');

                        const dailyDevotionalTime: any = setting?.dailyDevotionalTime?.split(':') || ['8', '0'];
                        let meridian = 'PM';

                        if (Number(dailyDevotionalTime[0]) > 12) {
                              meridian = 'PM';
                              dailyDevotionalTime[0] = Number(dailyDevotionalTime[0]) - 12;
                        } else if (Number(dailyDevotionalTime[0]) < 12) {
                              meridian = 'AM';
                              if (Number(dailyDevotionalTime[0]) === 0) dailyDevotionalTime[0] = 12;
                        }

                        if (time[1] === meridian && Number(hours) === Number(dailyDevotionalTime[0]) && Number(minutes) === Number(dailyDevotionalTime[1])) {
                              const tokenSet = new Set();
                              result[timeZone]?.map(item => {
                                    item?.pushTokens?.forEach((ti: { token: string }) => tokenSet.add(ti.token));
                              });

                              // Send notifications to users in the timezone
                              const { title, description } = await getNotificationTemplate(
                                NOTIFICATION_TEMPLATE.dailyDevotion,
                                timeZone?.language,
                                NOTIFICATION_TEMPLATE_FALLBACKS[
                                  NOTIFICATION_TEMPLATE.dailyDevotion
                                ],
                              );
                              const notificationPayload = {
                                    title,
                                    body: description.replace("{seriesTitles}", dailyDevotional.title),
                                    data: {
                                          dailyDevotional: {
                                                _id: dailyDevotional._id,
                                                description: dailyDevotional.description,
                                                image: awsBucket[config.NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + dailyDevotional.image,
                                          },
                                    },
                              };

                              const tokens: any = Array.from(tokenSet);
                              await pushNotification(tokens, notificationPayload.title, notificationPayload.body, JSON.stringify(notificationPayload.data));

                              // Log notifications sent
                              tokens.forEach(async token => {
                                    const notificationLog = new NotificationsModel({
                                          userId: users[0]._id, // Assuming all users in the timezone are logged for simplicity
                                          type: 'user',
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
                        }
                  } catch (error: any) {
                        console.log('Users processing error - ', error.message);
                        const notificationLog = new NotificationsModel({
                              userId: users[0]._id, // Assuming all users in the timezone are logged for simplicity
                              type: 'user',
                              notification: {
                                    dailyDevotionalId : dailyDevotional._id,
                                    title: '🔔 Start your day with inspiration!',
                                    description: `📙 Today's Devotional: ${dailyDevotional.title}. Dive in now for a dose of spiritual nourishment 🔖`,
                                    success: true,
                                    errorMessage: `Users processing error -', ${error.message}`,
                              },
                              createdAt: new Date(),
                        });
                        await notificationLog.save();
                  }
            });
            console.log('JOB(✅) Daily devotional executed successfully!');
            cronLog.status = 'success';
            cronLog.endedAt = new Date();
            await cronLog.save();
      } catch (error: any) {
            console.log('JOB(🔴) Daily devotional execution Error is - ', error.message);
            const cronLog = new CronLogModel({
                  jobName: 'daily_devotional_notifier',
                  status: 'failed',
                  endedAt: new Date(),
                  message: `daily devotional job failed: ${error.message}`,
            });
            await cronLog.save();
      }
};

(async(config) => {
      const cronSchedule = await CronScheduleModel.findOne({ jobName: cronDirectory.DAILYDEVOTIONALNOTIFICATION }).lean().exec();

      if (!cronSchedule) {
            console.log('Job not found');
            return;
      }
      if (cronSchedule.jobRestrictEnv.indexOf(config.NODE_ENV) > -1) {
            console.log(`JOB(🟡) Daily devotional not initiated due to ${config.NODE_ENV} Environment`);
            return;
      }
      const schedule = Object.values(cronSchedule.schedule).join(' ');
      new CronJob(schedule, () => { start() }, null, true);
      console.log('JOB(🟢) Daily devotional initiated successfully!');
})(config);
