import * as cron from 'cron';
import { fetchNotifications } from '../controllers/customers/notification.controller';
import { pushNotification, compileHtml, sentEmail } from '../lib/utils/utils';
import { emailTemplatesTitles, originEmails, origins } from '../constants/app.constant';
import { renewalReminderNotification } from '../constants/cron.constants';
import { UserModel, getUserType } from '../models/user.model';
import { io } from '../app';

import notificationsService from '../services/customers/notifications/notifications.service';
import emailTemplateService from '../services/admin/emailTemplate/emailTemplate.service';
import stripeSubscriptionServices from '../services/stripe/subscription'
import config from '../../config';

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
                        title: emailTemplatesTitles.customer.HolyreadsPlanUpgrade,
                  }),
                  subject = emailTemplateDetails?.subject || `Holy Reads Renewal Reminder`;

            let html = `<p>Dear ${user.email.split('@')[0]},</p><p></p>${description}<p> Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

            if (emailTemplateDetails?.content) {
                  const
                        contentData = {
                              username: user.email.split('@')[0],
                              description,
                              link: origins[config.NODE_ENV],
                              title,
                        },
                        htmlData = await compileHtml(
                              emailTemplateDetails.content,
                              contentData
                        );

                  if (htmlData) { html = htmlData }
            }

            const result = await sentEmail({
                  from: originEmails.marketing,
                  to: user.email,
                  subject,
                  html,
            });

            if (!result) {
                  console.log('Failed to sent an renewal reminder email');
            }

      } catch ({ message }: any) {
            console.log('Failed to sent a renewal reminder email: Error: ', message);
      }
}

const start = async () => {
      try {
            console.log('JOB(🟢) Renewal Reminder Started successfully!');

            const users = await UserModel.find({ $or: [
                        {
                              'inAppSubscription.createdAt': { $exists: true },
                              'inAppSubscriptionStatus': 'Active',
                        },
                        {
                              'stripe.subscriptionId': { $exists: true },
                        },
                  ], status: 'Active',
            }).select([
                  'pushTokens',
                  'inAppSubscription',
                  'inAppSubscriptionStatus',
                  'stripe.planRenewRemindeAt',
                  'stripe.subscriptionId',
                  'subscription',
                  'notification',
                  'email',
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
                        const subscription = subscriptions[index] || {}
                        const now = new Date()
                        const timeAfter24 =
                              now.getTime() + (1000 * 60 * 60 * 24),
                              timeBefore24 =
                                    now.getTime() - (1000 * 60 * 60 * 24);

                        if (!subscription?.id && !user.inAppSubscription?.expiredAt) {
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
                        ) { return; } else if (user?.inAppSubscription?.expiredAt) {

                              if (
                                    /** If notified within 24 hours then skip */
                                    (new Date(user?.inAppSubscription?.planRenewRemindeAt)?.getTime() > timeBefore24) ||
                                    new Date(user?.inAppSubscription?.expiredAt).getTime() > timeAfter24
                              ) { return }
                        }
                        const message = {
                              active: {
                                    title: 'Holy Reads Renewal Reminder ⏳',
                                    description: `Holy Reads gently reminds to you that, Your ${user?.subscription?.title} plan will upgrade tomorrow ✨`,
                              },
                        }

                        emailPromises.push(
                              sentSubscriptionEmail(
                                    user, message.active.title, message.active.description
                              ).catch(() => { return undefined; })
                        )
                        notificationPromises.push(
                              sentNotification(
                                    message.active.title, message.active.description, user
                              ).catch(() => { return undefined; })
                        )

                        const body = user.inAppSubscription
                              ? { 'inAppSubscription.planRenewRemindeAt': now }
                              : { 'stripe.planRenewRemindeAt': new Date() }

                        userPromises.push(
                              UserModel.findOneAndUpdate(
                                    { _id: user._id }, body
                              ).catch(() => { return undefined; })
                        )

                  } catch ({ message }: any) {
                        console.log('JOB(🔴) Renewal Reminder execution Error is: ', message);
                  }
            })

            await Promise.all([
                  ...emailPromises,
                  ...userPromises,
                  ...notificationPromises,
            ])

            console.log('JOB(✅) Renewal Reminder executed successfully!');
      } catch ({ message }: any) {
            console.log('JOB(🔴) Renewal Reminder execution Error is: ', message);
      }
};

((cronConfig, config) => {
      if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
            console.log(`JOB(🟡) Renewal Reminder not initiated due to ${config.NODE_ENV} Environment`);
            return;
      }
      const schedule = Object.values(renewalReminderNotification.SCHEDULE).join(' ');
      new cron.CronJob(schedule, () => { start() }, null, true);
      console.log('JOB(🟢) Renewal Reminder initiated successfully!');
})(renewalReminderNotification, config);
