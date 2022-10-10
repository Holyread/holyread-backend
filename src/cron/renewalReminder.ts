import cron from 'cron';

import { fetchNotifications } from '../controllers/customers/notification.controller';
import { subscriptionPaymentNotifier } from '../constants/cron.constants'
import { emailTemplatesTitles } from '../constants/app.constant';
import { compileHtml, sentEmail, } from '../lib/utils/utils';
import { pushNotification } from '../lib/utils/utils';
import { UserModel } from '../models';
import { io } from '../app';

import notificationsService from '../services/customers/notifications/notifications.service';
import emailTemplateService from '../services/admin/emailTemplate/emailTemplate.service';
import stripeSubscriptionServices from '../services/stripe/subscription'
import config from "../../config";

/** Send and push notification */
const sentNotification = async (notificationTitle: string, notificationDescription: string, user) => {
      await notificationsService.createNotification({
            userId: user._id,
            type: 'setting',
            notification: {
                  title: notificationTitle,
                  description: notificationDescription
            }
      })
      fetchNotifications(io.sockets, { _id: user._id })
      /** Push notification */
      if (
            user?.notification?.subscription &&
            user?.notification?.push &&
            user.pushTokens.length
      ) {
            const tokens = user.pushTokens.map(i => i.token)
            pushNotification(tokens, notificationTitle, notificationDescription)
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
                              title,
                              description: description,
                              link: config.NODE_ENV
                        },
                        htmlData = await compileHtml(emailTemplateDetails.content, contentData);

                  if (htmlData) {
                        html = htmlData
                  }
            }

            const result = await sentEmail(user.email, sub, html);
            if (!result) {
                  console.log('Failed to sent an subscription reminder email');
            }
      } catch ({ message }) {
            console.log('Failed to sent an subscription reminder email: Error: ', message);
      }
}

const start = async () => {
      try {
            console.log('JOB(🟢) Renewal Reminder Started successfully!');

            const users = await UserModel.find({
                  'stripe.subscriptionId': { $exists: true },
                  status: 'Active'
            }).select([
                  'stripe.subscriptionId',
                  'stripe.planRenewRemindeAt',
                  'email',
                  'notification',
                  'pushTokens',
                  'subscription'
            ]).populate('subscription', 'title').lean().exec();

            if (!users?.length) {
                  console.log('JOB(🔴) Renewal Reminder execution stop due to no users found');
                  return;
            }

            const
                  emailPromises = [],
                  notificationPromises = [],
                  userPromises = [],
                  subscriptions = await Promise.all(
                        users.map(i =>
                              stripeSubscriptionServices.retrieveSubscription(
                                    i.stripe.subscriptionId
                              ).catch(() => { return undefined; })
                        )
                  );
            users.map((user: any, index) => {
                  try {
                        const subscription = subscriptions[index]
                        if (!subscription?.id) return;
                        const now = new Date()
                        const timeAfter24 =
                              now.getTime() + (1000 * 60 * 60 * 24),
                              timeBefore24 =
                                    now.getTime() - (1000 * 60 * 60 * 24);

                        if (
                              !['active', 'trialing'].includes(subscription?.status) ||
                              !subscription?.current_period_end ||
                              ((subscription?.current_period_end * 1000) > timeAfter24) ||
                              (
                                    /** If notified within 24 hours then skip */
                                    new Date(user?.stripe?.planRenewRemindeAt) &&
                                    new Date(user.stripe.planRenewRemindeAt).getTime() > timeBefore24
                              )
                        ) { return; }

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
                                    user, message[subscription.status].title, message[subscription.status].description
                              ).catch(() => { return undefined; })
                        )
                        notificationPromises.push(
                              sentNotification(
                                    message[subscription.status].title, message[subscription.status].description, user
                              ).catch(() => { return undefined; })
                        )
                        userPromises.push(
                              UserModel.findOneAndUpdate(
                                    { _id: user._id }, { 'stripe.planRenewRemindeAt': new Date() }
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
      const schedule = Object.values(subscriptionPaymentNotifier.SCHEDULE).join(' ');
      new cron.CronJob(schedule, () => { start() }, null, true);
      console.log('JOB(🟢) Renewal Reminder initiated successfully!');
})(subscriptionPaymentNotifier, config);
