import cron from 'cron';

import { fetchNotifications } from '../controllers/customers/notification.controller';
import { pushNotification, compileHtml, sentEmail } from '../lib/utils/utils';
import { emailTemplatesTitles, origins } from '../constants/app.constant';
import { renewalReminder } from '../constants/cron.constants';
import { UserModel, getUserType } from '../models/user.model';
import { io } from '../app';

import notificationsService from '../services/customers/notifications/notifications.service';
import emailTemplateService from '../services/admin/emailTemplate/emailTemplate.service';
import stripeSubscriptionServices from '../services/stripe/subscription'
import config from "../../config";

/** Send and push notification */
const sentNotification = async (title: string, description: string, user: getUserType) => {
      await notificationsService.createNotification({
            notification: { title, description },
            userId: user._id,
            type: 'setting',
      })
      fetchNotifications(io.sockets, { _id: user._id })
      /** Push notification */
      if (
            user?.notification?.subscription &&
            user?.notification?.push &&
            user.pushTokens.length
      ) {
            const tokens: string[] = user.pushTokens.map(i => i.token)
            pushNotification(tokens, title, description)
      }
}

/** Sent subscription activation email */
const sentSubscriptionEmail = async (user, title, description) => {
      try {
            const emailTemplateDetails =
                  await emailTemplateService.getOneEmailTemplateByFilter({
                        title: emailTemplatesTitles.customer.HolyreadsPlanUpgrade
                  }),
                  sub = emailTemplateDetails?.subject || `Holy Reads Renewal Reminder`;

            let html = `<p>Dear ${user.email.split('@')[0]},</p><p></p>${description}<p> Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

            if (emailTemplateDetails?.content) {
                  const
                        contentData = {
                              username: user.email.split('@')[0],
                              description: description,
                              link: origins[config.NODE_ENV],
                              title
                        },
                        htmlData = await compileHtml(
                              emailTemplateDetails.content,
                              contentData
                        );

                  if (htmlData) { html = htmlData }
            }

            const result = await sentEmail(user.email, sub, html);
            
            if (!result) {
                  console.log('Failed to sent an renewal reminder email');
            }

      } catch ({ message }) {
            console.log('Failed to sent a renewal reminder email: Error: ', message);
      }
}

const start = async () => {
      try {
            console.log('JOB(🟢) Renewal Reminder Started successfully!');

            const users = await UserModel.find({ $or: [
                        {
                              'inAppSubscription.createdAt': { $exists: true },
                              'inAppSubscriptionStatus': 'Active'
                        },
                        {
                              'stripe.subscriptionId': { $exists: true } 
                        },
                  ], status: 'Active'
            }).select([
                  'pushTokens',
                  'inAppSubscription',
                  'inAppSubscriptionStatus',
                  'stripe.planRenewRemindeAt',
                  'stripe.subscriptionId',
                  'subscription',
                  'notification',
                  'email'
            ]).populate('subscription', 'title duration').lean().exec();

            if (!users?.length) {
                  console.log('JOB(🔴) Renewal Reminder execution stop due to no users found');
                  return;
            }

            const
                  emailPromises = [],
                  notificationPromises = [],
                  userPromises = [],
                  subscriptions = await Promise.all(
                        users.map(i => {
                              if (i?.stripe?.subscriptionId) {
                                    return stripeSubscriptionServices.retrieveSubscription(
                                          i.stripe.subscriptionId
                                    ).catch(() => { return undefined; })
                              }
                              return undefined
                        })
                  );
            users.map((user: any, index) => {
                  try {
                        let subscription = subscriptions[index] || {}
                        const now = new Date()
                        const timeAfter24 =
                              now.getTime() + (1000 * 60 * 60 * 24),
                              timeBefore24 =
                                    now.getTime() - (1000 * 60 * 60 * 24);

                        if (!subscription?.id && !user.inAppSubscription?.createdAt) {
                              return;
                        }

                        if (
                              subscription?.id &&
                              (
                                    /** If notified within 24 hours then skip */
                                    (new Date(user?.stripe?.planRenewRemindeAt)?.getTime() > timeBefore24) ||
                                    ((subscription?.current_period_end * 1000) > timeAfter24) ||
                                    !['active', 'trialing'].includes(subscription?.status) ||
                                    !subscription?.current_period_end
                              )
                        ) { return; }

                        else if (user?.inAppSubscription) {
                              let now = new Date(user?.inAppSubscription?.createdAt), subscriptionEndDate;

                              switch (user.subscription.duration) {
                                    case "Year":
                                          subscriptionEndDate = now.setMonth(now.getMonth() + 12);
                                          break;
                                    case "Half Year":
                                          subscriptionEndDate = now.setMonth(now.getMonth() + 6);
                                          break;
                                    default:
                                          subscriptionEndDate = now.setMonth(now.getMonth() + 1);
                                          break;
                              }
                              if (
                                    /** If notified within 24 hours then skip */
                                    (new Date(user?.inAppSubscription?.planRenewRemindeAt)?.getTime() > timeBefore24) ||
                                    subscriptionEndDate > timeAfter24
                              ) { return }
                        }
                        const message = {
                              trailing: {
                                    title: 'Holy Reads Renewal Reminder ⏳',
                                    description: `Holy Reads gently reminds to you that, Your ${user?.subscription?.title} trail will upgrade as active plan from the tomorrow ✨`
                              },
                              active: {
                                    title: 'Holy Reads Renewal Reminder ⏳',
                                    description: `Holy Reads gently reminds to you that, Your ${user?.subscription?.title} plan will upgrade tomorrow ✨`
                              }
                        }

                        emailPromises.push(
                              sentSubscriptionEmail(
                                    user, message[subscription.status || 'active'].title, message[subscription.status || 'active'].description
                              ).catch(() => { return undefined; })
                        )
                        notificationPromises.push(
                              sentNotification(
                                    message[subscription.status || 'active'].title, message[subscription.status || 'active'].description, user
                              ).catch(() => { return undefined; })
                        )

                        let body = user.inAppSubscription
                              ? { 'inAppSubscription.planRenewRemindeAt': now }
                              : { 'stripe.planRenewRemindeAt': new Date() }

                        userPromises.push(
                              UserModel.findOneAndUpdate(
                                    { _id: user._id }, body
                              ).catch(() => { return undefined; })
                        )

                  } catch ({ message }) {
                        console.log('JOB(🔴) Renewal Reminder execution Error is: ', message);
                  }
            })

            await Promise.all([
                  ...emailPromises,
                  ...userPromises,
                  ...notificationPromises
            ])

            console.log('JOB(✅) Renewal Reminder executed successfully!');
      } catch ({ message }) {
            console.log('JOB(🔴) Renewal Reminder execution Error is: ', message);
      }
};

((cronConfig, config) => {
      if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
            console.log(`JOB(🟡) Renewal Reminder not initiated due to ${config.NODE_ENV} Environment`);
            return;
      }
      const schedule = Object.values(renewalReminder.SCHEDULE).join(' ');
      new cron.CronJob(schedule, () => { start() }, null, true);
      console.log('JOB(🟢) Renewal Reminder initiated successfully!');
})(renewalReminder, config);
