import { CronJob } from 'cron';
import config from '../../config';
import { dailyDevotionalNotification } from '../constants/cron.constants';
import { ReadsOfDayModel, SettingModel, UserModel, CronLogModel, NotificationsModel } from '../models';
import { groupByKey, pushNotification } from '../lib/utils/utils';
import { awsBucket } from '../constants/app.constant';

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

            /** Get Read of days */
            const readOfDay = await ReadsOfDayModel.findOne({
                  displayAt: { $gte: new Date(start), $lte: new Date(end) },
            }).select('title description image').lean().exec();

            // Check if read of the day exists
            if (!readOfDay) {
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
            }).select('timeZone pushTokens').lean().exec()

            // Check if there are eligible users
            if (!users.length) {
                  console.log('JOB(🔴) Daily devotional execution stop due to no users found');
                  return;
            }

            // Group users by timezone
            const result = groupByKey(users, 'timeZone');
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
                              const notificationPayload = {
                                    title: '🔔 Start your day with inspiration!',
                                    body: `📙 Today's Devotional: ${readOfDay.title}. Dive in now for a dose of spiritual nourishment 🔖`,
                                    data: {
                                          dailyDevotional: {
                                                _id: readOfDay._id,
                                                description: readOfDay.description,
                                                image: awsBucket[config.NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + readOfDay.image,
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
                                    title: '🔔 Start your day with inspiration!',
                                    description: `📙 Today's Devotional: ${readOfDay.title}. Dive in now for a dose of spiritual nourishment 🔖`,
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

((cronConfig, config) => {
      if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
            console.log(`JOB(🟡) Daily devotional not initiated due to ${config.NODE_ENV} Environment`);
            return;
      }
      const schedule = Object.values(dailyDevotionalNotification.SCHEDULE).join(' ');
      new CronJob(schedule, () => { start() }, null, true);
      console.log('JOB(🟢) Daily devotional initiated successfully!');
})(dailyDevotionalNotification, config);
