import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import userService from '../../services/customers/users/user.service';
import stripeSubscriptionService from '../../services/stripe/subscription'
import transactionsService from '../../services/customers/users/transactions.service'
import emailTemplateService from '../../services/admin/emailTemplate/emailTemplate.service';
import { emailTemplatesTitles } from '../../constants/app.constant';
import { compileHtml, pushNotification, sentEmail } from '../../lib/utils/utils';
import subscriptionsService from '../../services/admin/subscriptions/subscriptions.service';
import { fetchNotifications } from './notification.controller';
import notificationsService from '../../services/customers/notifications/notifications.service';
import { io } from '../../app';

/** Create transaction */
const createTransaction = async (request: Request, response: Response, next: NextFunction) => {
      try {
            const event = request.body;
            const session = event?.data?.object;
            /** invalid request */
            if (!session) return next(Boom.badRequest())

            const user = await userService.getOneUserByFilter({ 'stripe.customerId': session.customer })
            if (!user) return next(Boom.notAcceptable())

            const transaction: any = {
                  userId: user._id,
                  latestInvoice: session?.latest_invoice,
                  planCreatedAt: new Date(session?.current_period_start * 1000),
                  planExpiredAt: new Date(session?.current_period_end * 1000),
                  total: (session?.plan?.amount || 0) / 100,
                  status: session?.status,
                  reason: '',
                  device: 'web'
            }
            /** Send and push notification */
            const sentNotification = async (notificationTitle: string, notificationDescription: string) => {
                  await notificationsService.createNotification({ userId: user._id, type: 'setting', notification: { title: notificationTitle, description: notificationDescription } })
                  fetchNotifications(io.sockets, { _id: user._id })
                  /** Push notification */
                  if (user.pushTokens.length && user?.notification?.push && user?.notification?.subscription) {
                        const tokens = user.pushTokens.map(i => i.token)
                        pushNotification(tokens, notificationTitle, notificationDescription)
                  }
            }
            /** Sent subscription activation email */
            const subscriptionDetails = await subscriptionsService.getOneSubscriptionByFilter({ _id: user.subscription })
            const sentSubscriptionEmail = async () => {
                  const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.subscriptionActivated })
                  const sub = emailTemplateDetails.subject || `Holy Reads Subscription Activated`
                  let html = `<p>Dear ${user.email.split('@')[0]},</p><p>Your holy reads subscription activated successfully.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`
                  if (emailTemplateDetails && emailTemplateDetails.content) {
                        const localeDate = transaction.planExpiredAt?.toLocaleDateString()?.split('/')
                        const contentData = {
                              username: user.email.split('@')[0],
                              price: transaction.total,
                              endDate: `[${localeDate[0]?.padStart(2, '0')}/${localeDate[1]?.padStart(2, '0')}/${localeDate[2]?.slice(-2)}]`,
                              duration: subscriptionDetails?.duration?.toLowerCase()?.includes('half') ? subscriptionDetails.duration : `1 ${subscriptionDetails.duration}`,
                              status: transaction?.status
                        }
                        const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                        if (htmlData) {
                              html = htmlData
                        }
                  }
                  const result = await sentEmail(user.email, sub, html);
                  if (!result) {
                        return next(Boom.badRequest('Failed to sent an subscription email'))
                  }
            }
            /** Get latest invoice details */
            const latestInvoice = await stripeSubscriptionService.getInvoice(session?.latest_invoice)
            transaction.account = {
                  country: latestInvoice.account_country,
                  name: latestInvoice.account_name,
                  taxIds: latestInvoice.account_tax_ids,
            }
            transaction.amount = {
                  subtotal: (latestInvoice?.subtotal | 0) / 100,
                  tax: (latestInvoice?.tax | 0) / 100,
                  total: (latestInvoice?.total | 0) / 100
            }
            transaction.invoiceAt = latestInvoice.created && new Date(latestInvoice.created * 1000)
            transaction.statusTransitions = latestInvoice.status_transitions
            transaction.customer = {
                  email: latestInvoice.customer_email,
                  name: latestInvoice.customer_name,
                  phone: latestInvoice.customer_phone,
                  shipping: latestInvoice.customer_shipping
            }

            const paymentIntent = await stripeSubscriptionService.getPaymentIntent(
                  latestInvoice?.payment_intent
            );
            transaction.paymentLink = latestInvoice?.hosted_invoice_url
            transaction.paymentMethod = (await stripeSubscriptionService.getPaymentMethod(paymentIntent?.payment_method))?.card
            if (!transaction.paymentMethod) {
                  const customer = await stripeSubscriptionService.getCustomer(session.customer)
                  const paymentMethod = await stripeSubscriptionService.getPaymentMethod(customer?.invoice_settings?.default_payment_method)
                  transaction.paymentMethod = paymentMethod?.card
            }
            /** Trail subscription does not required transation yet */
            if (session.status === 'trailing') {
                  return response.status(200)
            }

            /** No trail subscription */
            if (session.status === 'active') {
                  await transactionsService.createTransaction(transaction)
                  /** Sent subscription activation email */
                  await sentSubscriptionEmail()
                  Promise.all([sentNotification('Holyreads Subscription', `Holy reads ${subscriptionDetails.title} Subscription activated successfully 🎉`)])
                  return response.status(200)
            }

            if (paymentIntent?.status === 'requires_payment_method') {
                  transaction.reason = 'No Payment Method'
            }

            const now: Date = new Date()
            /** Set reason on payment failed */
            if (transaction?.paymentMethod) {
                  const isCardExpired = !!(transaction?.paymentMethod?.exp_month > (now.getMonth() + 1) && (transaction?.paymentMethod?.exp_year >= now.getFullYear()))
                  transaction.reason = isCardExpired ? 'Card Expired' : 'Decline Payment'
            }
            const status = ['past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired']
            
            if (event?.type !== 'customer.subscription.updated' || !status.includes(session?.status)) {
                  return response.status(200);
            }

            /** Failed payment transaction * sent cancel subscription email */
            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.subscriptionCancelled })
            const sub = emailTemplateDetails.subject || `Holy Reads Subscription Cancelled`
            let html = `<p>Dear ${user.email.split('@')[0]},</p><p>Your holy reads subscription cancelled.</p><p>Please click this <a href=${transaction?.paymentLink}>link</a> to reactive your subscription</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`
            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        link: transaction?.paymentLink
                  }
                  const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                  if (htmlData) {
                        html = htmlData
                  }
            }

            const result = await sentEmail(user.email, sub, html);
            if (!result) {
                  return next(Boom.badRequest('Failed to sent an cancel subscription email'))
            }
            response.status(200)
            Promise.all([sentNotification('Holyreads Subscription Cancelled ⛔', `Your Holy Reads ${subscriptionDetails.title} Subscription Cancelled`)])
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

// /** Create transaction */
const createAppTransaction = async (request: Request, response: Response, next: NextFunction) => {
      try {
            const body = request.body;
            const header = request.headers;
            await transactionsService.createAppTransaction({
                  result: { body, header }
            })
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

// /** Create transaction */
const createGoogleTransaction = async (request: Request, response: Response, next: NextFunction) => {
      try {
            const body = request.body;
            const header = request.headers;
            await transactionsService.createAppTransaction({
                  result: { body, header }
            })
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

export { createTransaction, createAppTransaction, createGoogleTransaction };
