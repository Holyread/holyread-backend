import { NextFunction, Request, Response } from 'express'

import Boom from '@hapi/boom';
import jwt from 'jsonwebtoken';

import { io } from '../../app';
import { fetchNotifications } from './notification.controller';
import { emailTemplatesTitles, originEmails } from '../../constants/app.constant';
import { compileHtml, pushNotification, sentEmail } from '../../lib/utils/utils';

import config from '../../../config';
import { SubscriptionsModel } from '../../models';

import stripeSubscriptionService from '../../services/stripe/subscription'

import userService from '../../services/customers/users/user.service';
import transactionsService from '../../services/customers/users/transactions.service'
import emailTemplateService from '../../services/admin/emailTemplate/emailTemplate.service';
import subscriptionsService from '../../services/admin/subscriptions/subscriptions.service';
import notificationsService from '../../services/customers/notifications/notifications.service';

const stripe = require('stripe')(config.STRIPE_SECRET);

/** Create transaction */
const createTransaction = async (
      request: Request,
      response: Response,
      next: NextFunction
) => {
      try {
            const event = request.body;
            const session = event?.data?.object;
            /** invalid request */
            if (!session) {
                  return next(Boom.badRequest())
            }

            const user = await userService.getOneUserByFilter({
                  'stripe.customerId': session.customer,
            })

            if (
                  !user
                  ||
                  (
                        !user?.subscription
                        &&
                        !session?.metadata?.hrSubscriptionId
                  )
            ) { return next(Boom.notAcceptable()) }

            processTransaction(user, session, event)

            response.status(200).send({ message: 'OK' });

      } catch (e: any) {
            return next(
                  Boom.badData(
                        e.message
                  )
            )
      }
}

const processTransaction = async (user: any, session: any, event: any) => {
      try {
            userService.updateUser({ _id: user._id }, { 'stripe.status': session?.status })
            /** Trial or incomplete subscription does not required transation yet */
            if (
                  [
                        'trialing',
                        'incomplete',
                  ]
                        .includes(
                              session?.status
                        )
            ) {
                  return
            }

            let subscriptionId = user?.subscription
            if (event.type === 'payment_intent.succeeded') {
                  subscriptionId = session.metadata.hrSubscriptionId
            }

            /** Sent subscription activation email */
            const subscriptionDetails = await subscriptionsService
                  .getOneSubscriptionByFilter({
                        _id: subscriptionId,
                  })

            const sentSubscriptionEmail = async (
                  planExpiredAt?: Date,
                  total?: number,
                  status?: string
            ) => {
                  const emailTemplateDetails = await emailTemplateService
                        .getOneEmailTemplateByFilter({
                              title: emailTemplatesTitles.customer.subscriptionActivated,
                        })

                  const subject = emailTemplateDetails.subject
                        || `Holy Reads Subscription Activated`
                  let html = `
                        <p>
                              Dear ${user.email.split('@')[0]},
                        </p>
                        <p>
                              Your holy reads subscription activated successfully.
                        </p>
                        <p>
                              Should you have any questions or if any of your details change, please contact us.
                        </p>
                        <p>
                              Best regards,
                              <br>Holy Reads
                        </p>
                        <p>
                              <strong>
                                    ( ***&nbsp; Please do not reply to this email ***&nbsp; )
                              </strong>
                        </p>
                  `
                  if (emailTemplateDetails && emailTemplateDetails.content) {
                        const localeDate = planExpiredAt
                              ?.toLocaleDateString()
                              ?.split('/')

                        const contentData = {
                              username: user.email.split('@')[0],
                              price: total,
                              endDate: `${localeDate[0]?.padStart(2, '0')}/${localeDate[1]?.padStart(2, '0')}/${localeDate[2]?.slice(-2)}`,
                              duration: subscriptionDetails
                                    ?.duration
                                    ?.toLowerCase()
                                    ?.includes('half')
                                    ? subscriptionDetails.duration
                                    : `1 ${subscriptionDetails.duration}`,
                              status,
                        }
                        const htmlData = await compileHtml(
                              emailTemplateDetails.content,
                              contentData
                        )
                        if (htmlData) {
                              html = htmlData
                        }
                  }
                  const result = await sentEmail({
                        from: originEmails.marketing,
                        to: user.email,
                        subject,
                        html,
                  });
                  if (!result) {
                        console.log(
                              'Failed to sent an subscription email'
                        )
                        return
                  }
            }

            // In App stripe payment succeed using holyreads payment sheet api
            // Disabled webhook, not proceed yet
            if (event.type === 'payment_intent.succeeded') {

                  // Retrieve the payment intent used to pay the subscription
                  const paymentIntent =
                        await stripeSubscriptionService.getPaymentIntent(
                              session?.id
                        );

                  if (!paymentIntent?.id) {
                        return;
                  }

                  const now = new Date(paymentIntent.created * 1000);
                  let planExpiredAt: any;

                  switch (subscriptionDetails.duration) {
                        case 'Year':
                              planExpiredAt = new Date(
                                    now.setMonth(new Date().getMonth() + 12)
                              );
                              break;
                        case 'Half Year':
                              planExpiredAt = new Date(
                                    now.setMonth(new Date().getMonth() + 6)
                              );
                              break;
                        default:
                              planExpiredAt = new Date(
                                    now.setMonth(new Date().getMonth() + 1)
                              );
                              break;
                  }
                  await userService.updateUser(
                        { 'stripe.customerId': user.stripe.customerId },
                        {
                              'inAppSubscriptionStatus': 'Active',
                              'inAppSubscription.transaction.expiresDate': new Date(planExpiredAt).getTime(),
                              'stripe.createdAt': now,
                              subscription: subscriptionDetails._id,
                              'stripe.planId': session.metadata?.planId,
                              'stripe.paymentIntent': paymentIntent?.id,
                              'stripe.ephemeralKey': session.metadata?.ephemeralKey,
                        })
                  const amount = session?.amount / 100 || Number(subscriptionDetails.price)
                  await sentSubscriptionEmail(
                        planExpiredAt,
                        amount,
                        'Active'
                  )
                  const charge = session?.charges?.data[0]
                  const transaction: any = {
                        userId: user._id,
                        latestInvoice: session?.invoice,
                        total: amount,
                        status: session?.status,
                        reason: '',
                        device: 'app',
                        event: event.id,
                        planId: subscriptionDetails.planId,
                        planCreatedAt: now,
                        planExpiredAt,
                        paymentLink: charge?.receipt_url,
                        paymentMethod: charge?.payment_method_details?.card,
                        account: {
                              country: charge?.billing_details?.address?.country,
                              name: charge?.billing_details?.name,
                        },
                        amount: {
                              subtotal: (session?.amount_received || 0) / 100,
                              tax: (session?.application_fee_amount || 0) / 100,
                              total: (session?.amount || 0) / 100,
                              discount: 0,
                        },
                        invoiceAt: now,
                        customer: {
                              email: charge?.billing_details?.email,
                              name: charge?.billing_details?.name,
                              phone: charge?.billing_details?.phone,
                              shipping: charge?.billing_details,
                        },
                  }
                  const createdTransaction = await transactionsService.createTransaction(transaction)
                  userService.updateUser({ _id: user._id }, { lastTrnId: createdTransaction._id })
                  return;
            }

            /**
             * Incoming webhook on confirm card payment
             * On subscription purchase from web and confirm payment
             */
            if (
                  event.type === 'invoice.payment_succeeded' &&
                  session.subscription &&
                  session.payment_intent
            ) {
                  /**
                   * The subscription automatically activates after successful payment
                   * Set the payment method used to pay the first invoice
                   * as the default payment method for that subscription
                   */
                  const subscription_id = session.subscription
                  const payment_intent_id = session.payment_intent

                  /* Retrieve the payment intent used to pay the subscription */
                  const payment_intent =
                        await stripeSubscriptionService.getPaymentIntent(
                              payment_intent_id
                        );

                  try {
                        await stripe.subscriptions.update(
                              subscription_id,
                              {
                                    default_payment_method: payment_intent.payment_method,
                              }
                        );

                        console.log(
                              'Default payment method set for subscription:',
                              payment_intent.payment_method
                        );
                  } catch (err) {
                        console.log(
                              '⚠️ Falied to update the default payment method for subscription:',
                              subscription_id
                        );
                  }
                  return;
            }

            const transaction: any = {
                  userId: user._id,
                  latestInvoice: session?.latest_invoice,
                  total: (session?.plan?.amount || 0) / 100,
                  status: session?.status,
                  reason: '',
                  device: 'web',
                  stripeSubscriptionId: session.id,
                  event: event.id,
                  planId: session?.plan?.id,
            }

            if (session?.current_period_start) {
                  transaction.planCreatedAt =
                        new Date(session?.current_period_start * 1000)
            }

            if (session?.current_period_end) {
                  transaction.planExpiredAt =
                        new Date(session?.current_period_end * 1000)
            }

            if ('invoice.payment_succeeded' !== event.type) {
                  userService.updateUser(
                        { _id: user._id },
                        {
                              'stripe.expiredAt': transaction.planExpiredAt,
                              'stripe.subscriptionId': session.id,
                              'stripe.customerId': session.customer,
                              'stripe.planId': transaction.planId,
                        })
            }

            /** Send and push notification */
            const sentNotification = async (
                  notificationTitle: string,
                  notificationDescription: string
            ) => {
                  await notificationsService.createNotification({
                        userId: user._id,
                        type: 'setting',
                        notification: {
                              title: notificationTitle,
                              description: notificationDescription,
                        },
                  })

                  fetchNotifications(io.sockets, { _id: user._id })
                  /** Push notification */
                  if (
                        user.pushTokens.length
                        && user?.notification?.push
                        && user?.notification?.subscription
                  ) {
                        const tokens = user.pushTokens.map(i => i.token)

                        pushNotification(
                              tokens,
                              notificationTitle,
                              notificationDescription
                        )
                  }
            }

            /** Get latest invoice details */
            const latestInvoice = await stripeSubscriptionService
                  .getInvoice(
                        session?.latest_invoice
                  )
            let paymentIntent;
            if (latestInvoice?.id) {
                  transaction.account = {
                        country: latestInvoice?.account_country,
                        name: latestInvoice?.account_name,
                        taxIds: latestInvoice?.account_tax_ids,
                  }
                  transaction.amount = {
                        subtotal: (latestInvoice?.subtotal || 0) / 100,
                        tax: (latestInvoice?.tax || 0) / 100,
                        total: (latestInvoice?.total || 0) / 100,
                        discount: (
                              latestInvoice
                                    ?.total_discount_amounts[0]
                                    ?.amount || 0
                        ) / 100,
                  }
                  transaction.invoiceAt =
                        latestInvoice.created
                        &&
                        new Date(latestInvoice.created * 1000)

                  transaction.statusTransitions = latestInvoice.status_transitions
                  transaction.customer = {
                        email: latestInvoice.customer_email,
                        name: latestInvoice.customer_name,
                        phone: latestInvoice.customer_phone,
                        shipping: latestInvoice.customer_shipping,
                  }

                  paymentIntent = await stripeSubscriptionService.getPaymentIntent(
                        latestInvoice?.payment_intent || session.payment_intent
                  );
            }

            transaction.paymentLink = latestInvoice?.hosted_invoice_url
            transaction.paymentMethod = (
                  await stripeSubscriptionService
                        .getPaymentMethod(
                              paymentIntent?.payment_method
                        )
            )?.card
            if (!transaction.paymentMethod) {
                  const customer =
                        await stripeSubscriptionService
                              .getCustomer(session.customer)
                  const paymentMethod =
                        await stripeSubscriptionService
                              .getPaymentMethod(
                                    customer
                                          ?.invoice_settings
                                          ?.default_payment_method
                              )
                  transaction.paymentMethod = paymentMethod?.card
            }

            /** Process active subscription */
            if (session.status === 'active') {
                  const createdTransaction = await transactionsService.createTransaction(transaction)
                  userService.updateUser({ _id: user._id }, { lastTrnId: createdTransaction._id })
                  /** Sent subscription activation email */
                  await sentSubscriptionEmail(
                        transaction?.planExpiredAt,
                        transaction.total,
                        transaction.status
                  )
                  Promise.all([
                        sentNotification(
                              'Holy Reads Subscription',
                              `Holy Reads ${subscriptionDetails.duration.includes('Half')
                                    ? subscriptionDetails.duration
                                    : '1 ' + subscriptionDetails.duration
                              } Subscription activated successfully 🎉`),
                  ])
                  return
            }

            if (paymentIntent?.status === 'requires_payment_method') {
                  transaction.reason = 'No Payment Method'
            }

            const now: Date = new Date()
            /** Set reason on payment failed */
            if (transaction?.paymentMethod) {
                  const isCardExpired = !!(
                        (
                              transaction?.paymentMethod?.exp_month
                              >
                              (now.getMonth() + 1)
                        )
                        &&
                        (
                              transaction?.paymentMethod?.exp_year
                              >= now.getFullYear()
                        )
                  )
                  transaction.reason =
                        isCardExpired ? 'Card Expired' : 'Decline Payment'
            }
            const status = [
                  'past_due',
                  'unpaid',
                  'canceled',
                  'incomplete_expired',
            ]
            const createdTransaction = await transactionsService.createTransaction(transaction)
            userService.updateUser({ _id: user._id }, { lastTrnId: createdTransaction._id })

            if (
                  event?.type !== 'customer.subscription.updated'
                  ||
                  !status.includes(session?.status)
            ) {
                  return
            }

            /** Failed payment transaction * sent cancel subscription email */
            const emailTemplateDetails =
                  await emailTemplateService
                        .getOneEmailTemplateByFilter({
                              title: emailTemplatesTitles
                                    .customer
                                    .subscriptionCanceled,
                        })

            const subject = emailTemplateDetails.subject
                  || `Holy Reads Subscription Canceled`

            let html = `
                  <p>
                        Dear ${user.email.split('@')[0]},
                  </p>
                  <p>
                        Your holy reads subscription canceled.
                  </p>
                  <p>
                        Please click this
                              <a href=${transaction?.paymentLink}>
                                    link
                              </a>
                        to reactive your subscription
                  </p>
                  <p>
                        Should you have any questions or if any of your details change, please contact us.
                  </p>
                  <p>
                        Best regards,
                              <br>Holy Reads
                  </p>
                  <p>
                        <strong>
                              ( ***&nbsp; Please do not reply to this email ***&nbsp; )
                        </strong>
                  </p>`
            if (
                  emailTemplateDetails
                  &&
                  emailTemplateDetails.content
            ) {
                  const contentData = {
                        link: transaction?.paymentLink,
                  }
                  const htmlData = await compileHtml(
                        emailTemplateDetails.content,
                        contentData
                  )
                  if (htmlData) {
                        html = htmlData
                  }
            }

            const result = await sentEmail({
                  from: originEmails.marketing,
                  to: user.email,
                  subject,
                  html,
            });
            if (!result) {
                  console.log(
                        'Failed to sent an cancel subscription email'
                  )
                  return;
            }
            Promise.all([
                  sentNotification(
                        'Holy Reads Subscription Canceled ⛔',
                        `Your Holy Reads ${subscriptionDetails.title} Subscription Canceled`
                  ),
            ])
      } catch (e: any) {
            console.log(
                  e.message
            )
      }
}

/** Create transaction */
const createAppTransaction = async (
      request: Request,
      response: Response,
      next: NextFunction
) => {
      try {
            const body = request.body;
            const header = request.headers;
            const transaction = await transactionsService.createAppTransaction({
                  result: { body, header },
            })

            if (!body?.signedPayload) {
                  return next(Boom.notFound('Signed Payload is null'))
            }

            /* JWS header, payload, and signature representations */
            const splitParts = body.signedPayload.split('.');
            if (splitParts.length !== 3) {
                  return next(Boom.notFound('Invalid signedPayload'));
            }

            if (!splitParts[0]) {
                  return next(Boom.notFound('Invalid jws_header part'));
            }

            if (!splitParts[1]) {
                  return next(Boom.notFound('Invalid jws_payload part'));
            }

            if (!splitParts[2]) {
                  return next(Boom.notFound('Invalid jws_signature part'));
            }

            const encodeHeaderBuff = Buffer.from(splitParts[0], 'base64');
            const decodedHeader: any = JSON.parse(encodeHeaderBuff.toString());

            jwt.verify(
                  splitParts[0],
                  decodedHeader.x5c[0],
                  {
                        algorithms: [decodedHeader.alg],
                  },
                  function (error: { message: string }, payload: Object) {
                        if (error) {
                              console.log(error.message);
                        }
                  }
            );

            const payload = splitParts[1];

            const dataBuff = Buffer.from(payload, 'base64');
            const v2Notification = JSON.parse(dataBuff.toString());

            if (!v2Notification?.data) {
                  return next(Boom.badData('v2Notification is undefined or is not valid'));
            }

            let v2RenewalInfo = undefined;
            if (v2Notification?.data?.signedRenewalInfo) {
                  const renewalInfoBuff
                        = Buffer
                              .from(
                                    v2Notification
                                          .data
                                          .signedRenewalInfo
                                          .split('.')[1],
                                    'base64'
                              );
                  v2RenewalInfo = JSON.parse(renewalInfoBuff.toString());
            }

            const transactionInfoBuff
                  = Buffer
                        .from(
                              v2Notification
                                    .data
                                    .signedTransactionInfo
                                    .split('.')[1],
                              'base64'
                        );
            const v2TransactionInfo = JSON.parse(transactionInfoBuff.toString());
            await transactionsService.updateAppTransaction({ _id: transaction._id }, {
                  result: {
                        body,
                        header,
                        v2TransactionInfo,
                        v2RenewalInfo,
                        v2Notification,
                  },
            })
            const user
                  = await userService.getOneUserByFilter({
                        $or: [
                              {
                                    'inAppSubscription.originalTransactionIdentifierIOS':
                                          v2TransactionInfo.originalTransactionId,
                              },
                              {
                                    'inAppSubscription.transactionId':
                                          v2TransactionInfo?.transactionId,
                              },
                        ],
                  })
            if (!user) {
                  return next(Boom.notFound('User details not found'));
            }

            let inAppSubscriptionStatus = user.inAppSubscriptionStatus;
            const inAppPurchaseBody = {
                  ...user.inAppSubscription,
                  renewalInfo: v2RenewalInfo,
                  receipt: body.signedPayload,
                  notification: v2Notification,
                  transaction: v2TransactionInfo,
                  productId: v2TransactionInfo?.productId,
                  purchaseDate: v2TransactionInfo?.purchaseDate,
                  transactionId: v2TransactionInfo?.transactionId,
                  originalTransactionDateIOS: v2TransactionInfo?.originalPurchaseDate,
            }
            const subscriptionInfo = await subscriptionsService.getOneSubscriptionByFilter({
                  duration:
                        v2TransactionInfo?.productId?.toLowerCase()?.includes('six')
                              ? 'Half Year'
                              : v2TransactionInfo.productId.includes('month')
                                    ? 'Month'
                                    : 'Year',
            })
            if (!subscriptionInfo) {
                  return next(Boom.notFound('Faild to fetch subscription details'))
            }
            const createTransaction = async () => {
                  const createdTransaction = await transactionsService.createTransaction({
                        latestInvoice: '',
                        planCreatedAt: new Date(),
                        planExpiredAt: new Date(v2TransactionInfo.expiresDate),
                        userId: user._id,
                        total: subscriptionInfo.price,
                        status: v2Notification.notificationType.toLowerCase(),
                        paymentMethod: null,
                        reason: '',
                        paymentLink: '',
                        device: 'app',
                  })
                  userService.updateUser({ _id: user._id }, { lastTrnId: createdTransaction._id })
            }

            switch (v2Notification?.notificationType) {
                  case 'TEST':
                        /*
                              1) A notification type that the App Store server sends when you request
                              it by calling the Request a Test Notification endpoint.
                              Call that endpoint to test if your server is receiving notifications.
                              You receive this notification only at your request.
                              For more troubleshooting information,
                              see the Get Test Notification Status endpoint.
                        */
                        break;
                  case 'REFUND':
                        /*
                              1) Indicates that the App Store successfully refunded a transaction
                              for a consumable in-app purchase, a non-consumable in-app purchase,
                              an auto-renewable subscription, or a non-renewing subscription.

                              2) The revocationDate contains the timestamp of the refunded transaction.
                              The originalTransactionId and productId identify the original transaction
                              and product. The revocationReason contains the reason.

                              3) To request a list of all refunded transactions for a user,
                              see Get Refund History in the App Store Server API.
                        */
                        await createTransaction()
                        break;
                  case 'REVOKE':
                        /*
                              1) Indicates that an in-app purchase the user was entitled to through
                              Family Sharing is no longer available through sharing.
                              The App Store sends this notification when a purchaser
                              disabled Family Sharing for a product, the purchaser (or family member) left the family group,
                              or the purchaser asked for and received a refund.
                              Your app also receives a paymentQueue(_:didRevokeEntitlementsForProductIdentifiers:) call.
                              Family Sharing applies to non-consumable in-app purchases
                              and auto-renewable subscriptions. For more information about Family Sharing,
                              see Supporting Family Sharing in Your App.
                        */
                        inAppSubscriptionStatus = 'Canceled'
                        await createTransaction()
                        break;
                  case 'EXPIRED':
                        /*
                              1) A notification type that along with its subtype indicates
                              that a subscription expired. If the subtype is VOLUNTARY,
                              the subscription expired after the user disabled subscription renewal.
                              If the subtype is BILLING_RETRY, the subscription expired because
                              the billing retry period ended without a successful billing transaction.
                              If the subtype is PRICE_INCREASE, the subscription expired because
                              the user didn’t consent to a price increase that requires user consent.
                              If the the subtype is PRODUCT_NOT_FOR_SALE,
                              the subscription expired because the product wasn’t available for
                              purchase at the time the subscription attempted to renew.

                              2) A notification without a subtype indicates that the subscription expired
                              for some other reason.
                        */
                        if (
                              !v2Notification.subtype ||
                              [
                                    'BILLING_RETRY',
                                    'PRICE_INCREASE',
                                    'PRODUCT_NOT_FOR_SALE',
                              ].includes(v2Notification.subtype)
                        ) {
                              inAppSubscriptionStatus = 'Canceled';
                              await createTransaction()
                        }
                        break;
                  case 'DID_RENEW':
                        /*
                              1) A notification type that along with its subtype indicates
                              that the subscription successfully renewed.
                              If the subtype is BILLING_RECOVERY, the expired subscription
                              that previously failed to renew now successfully renewed.
                              If the substate is empty, the active subscription has successfully
                              auto-renewed for a new transaction period. Provide the customer with
                              access to the subscription’s content or service.
                        */
                        inAppSubscriptionStatus = 'Active'
                        await createTransaction()
                        break;
                  case 'SUBSCRIBED':
                        /*
                              1) A notification type that along with its subtype indicates that the user
                              subscribed to a product. If the subtype is INITIAL_BUY, the user either
                              purchased or received access through Family Sharing to the subscription
                              for the first time. If the subtype is RESUBSCRIBE, the user
                              resubscribed or received access through Family Sharing to the same subscription
                              or to another subscription within the same subscription group.
                        */
                        inAppSubscriptionStatus = 'Active'
                        await createTransaction()
                        break;
                  case 'OFFER_REDEEMED':
                        /*
                              1) A notification type that along with its subtype indicates that the user
                              redeemed a promotional offer or offer code.

                              2) If the subtype is INITIAL_BUY, the user redeemed the offer for a
                              first-time purchase. If the subtype is RESUBSCRIBE,
                              the user redeemed an offer to resubscribe to an inactive subscription.
                              If the subtype is UPGRADE, the user redeemed an offer to upgrade their
                              active subscription that goes into effect immediately. If the subtype is DOWNGRADE,
                              the user redeemed an offer to downgrade their active subscription that goes into
                              effect at the next renewal date. If the user redeemed an offer for their active
                              subscription, you receive an OFFER_REDEEMED notification type without a subtype.

                              3) For more information about promotional offers, see Implementing Promotional
                              Offers in Your App. For more information about offer codes, see Implementing Offer
                              Codes in Your App.
                        */
                        inAppSubscriptionStatus = 'Active'
                        break;
                  case 'PRICE_INCREASE':
                        /*
                              1) A notification type that along with its subtype indicates that the system
                              has informed the user of an auto-renewable subscription price increase.

                              2) If the price increase requires user consent,
                              the subtype is PENDING if the user hasn’t yet responded to the price increase,
                              or ACCEPTED if the user has consented to the price increase.

                              3) If the price increase doesn’t require user consent, the subtype is ACCEPTED.

                              4) For more information about how the system calls your app before it
                              displays the price consent sheet for subscription price increases
                              that require customer consent, see paymentQueueShouldShowPriceConsent(_:).
                              For more information about managing subscription prices, see Managing Price
                              Increases for Auto-Renewable Subscriptions and Managing Prices.
                        */
                        break;
                  case 'REFUND_DECLINED':
                        /*
                              1) Indicates that the App Store declined a refund
                              request initiated by the app developer.
                        */
                        break;
                  case 'RENEWAL_EXTENDED':
                        /*
                              1) Indicates that the App Store extended the subscription
                              renewal date that the developer requested.
                        */
                        break;
                  case 'DID_FAIL_TO_RENEW':
                        /*
                              1) A notification type that along with its subtype indicates
                              that the subscription failed to renew due to a billing issue.
                              The subscription enters the billing retry period. If the subtype
                              is GRACE_PERIOD, continue to provide service through the grace period.
                              If the subtype is empty, the subscription isn’t in a grace period
                              and you can stop providing the subscription service.

                              2) Inform the user that there may be an issue with
                              their billing information.
                              The App Store continues to retry billing for 60 days,
                              or until the user resolves their billing issue or cancels
                              their subscription,
                              whichever comes first. For more information, see Reducing
                              Involuntary Subscriber Churn.
                        */
                        if (!v2Notification.subtype) {
                              inAppSubscriptionStatus = 'Canceled'
                              await createTransaction()
                        }
                        break;
                  case 'CONSUMPTION_REQUEST':
                        /*
                              1) Indicates that the customer initiated a refund request
                              for a consumable in-app purchase, and the App Store is
                              requesting that you provide consumption data. For more information,
                              see Send Consumption Information.
                        */
                        break;
                  case 'GRACE_PERIOD_EXPIRED':
                        /*
                              1) Indicates that the billing grace period has ended without
                              renewing the subscription, so you can turn off access
                              to service or content. Inform the user that there may
                              be an issue with their billing information.
                              The App Store continues to retry billing for 60 days,
                              or until the user resolves their billing issue or
                              cancels their subscription, whichever comes first.
                              For more information, see Reducing Involuntary Subscriber Churn.
                        */
                        inAppSubscriptionStatus = 'Canceled'
                        await createTransaction()
                        break;
                  case 'DID_CHANGE_RENEWAL_PREF':
                        /*
                              1) A notification type that along with its subtype indicates
                              that the user made a change to their subscription plan.
                              If the subtype is UPGRADE, the user upgraded their subscription.
                              The upgrade goes into effect immediately, starting a new billing period,
                              and the user receives a prorated refund for the unused portion of
                              the previous period. If the subtype is DOWNGRADE, the user downgraded
                              or cross-graded their subscription. Downgrades take effect at the next
                              renewal. The currently active plan isn’t affected.
                              2) If the subtype is empty, the user changed their renewal preference
                              back to the current subscription, effectively canceling a downgrade.
                        */
                        if (v2Notification.subtype === 'UPGRADE') {
                              inAppSubscriptionStatus = 'Active';
                              await createTransaction()
                        }
                        break;
                  case 'DID_CHANGE_RENEWAL_STATUS':
                        /*
                              1) A notification type that along with its subtype indicates that the user
                              made a change to the subscription renewal status.
                              If the subtype is AUTO_RENEW_ENABLED, the user re-enabled subscription
                              auto-renewal. If the subtype is AUTO_RENEW_DISABLED, the user disabled
                              subscription auto-renewal, or the App Store disabled subscription
                              auto-renewal after the user requested a refund.
                        */
                        break;
                  default:
                        break;
            }

            await userService.updateUser(
                  { _id: user._id },
                  {
                        inAppSubscription: {
                              ...user.inAppSubscription,
                              ...inAppPurchaseBody,
                              expiredAt: new Date(v2TransactionInfo.expiresDate),
                        },
                        inAppSubscriptionStatus,
                  })

            response.status(200).send({ message: 'OK' });
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

// /** Create transaction */
const createGoogleTransaction = async (
      request: Request,
      response: Response,
      next: NextFunction
) => {
      try {
            const body = request.body;
            const header = request.headers;
            const transaction = await transactionsService.createAppTransaction({
                  result: { body, header },
            })

            if (!body?.message?.data) {
                  return next(Boom.notFound('data is null'))
            }

            const encodeDataBuff = Buffer.from(body.message.data, 'base64');
            const decodedData: any = JSON.parse(encodeDataBuff.toString());

            if (
                  !decodedData?.subscriptionNotification
                  &&
                  (
                        !decodedData?.subscriptionNotification
                        ||
                        decodedData?.oneTimeProductNotification
                  )
            ) {
                  return response
                        .status(200)
                        .send({
                              message:
                                    'Test or one time product notification received',
                        });
            }
            if (
                  !decodedData?.subscriptionNotification
            ) {
                  return next(
                        Boom.badData(
                              'SubscriptionNotification is null or is not valid'
                        )
                  );
            }

            const subscriptionNotification =
                  decodedData.subscriptionNotification;

            await transactionsService.updateAppTransaction({ _id: transaction._id }, {
                  result: {
                        body,
                        header,
                        subscriptionNotification,
                  },
            })

            const user = await userService
                  .getOneUserByFilter({
                        'inAppSubscription.purchaseToken':
                              subscriptionNotification
                                    .purchaseToken,
                  })

            if (!user) {
                  return next(
                        Boom.notFound(
                              'User details not found'
                        )
                  );
            }

            let inAppSubscriptionStatus = user.inAppSubscriptionStatus;

            const inAppPurchaseBody = {
                  ...user.inAppSubscription,
                  subscriptionNotification,
                  purchaseStateAndroid: subscriptionNotification?.notificationType,
            }

            const subscription = await SubscriptionsModel
                  .findOne({ _id: user?.subscription })
                  .lean()
                  .exec();

            const getMonths = () => {
                  const duration = subscription?.duration;

                  let months = 1;
                  switch (duration) {
                        case 'Month':
                              months = 1;
                              break;
                        case 'Half Year':
                              months = 6;
                              break;
                        case 'Year':
                              months = 12;
                              break;
                        default:
                              break;
                  }
                  return months;
            }

            let expiredAt = user?.inAppSubscription?.expiredAt;

            const createTransaction = async () => {
                  const createdTransaction = await transactionsService.createTransaction({
                        latestInvoice: '',
                        planCreatedAt: new Date(),
                        planExpiredAt: new Date(expiredAt),
                        userId: user._id,
                        total: Number(subscription?.price),
                        status: inAppSubscriptionStatus,
                        paymentMethod: undefined,
                        reason: '',
                        paymentLink: '',
                        device: 'app',
                  })
                  userService.updateUser({ _id: user._id }, { lastTrnId: createdTransaction._id })
            }

            switch (subscriptionNotification.notificationType) {
                  case 1:
                        /*
                              (1) SUBSCRIPTION_RECOVERED
                              - A subscription was recovered from account hold.
                        */

                        break;
                  case 2:
                        /*
                              (2) SUBSCRIPTION_RENEWED
                              - An active subscription was renewed.
                        */
                        inAppSubscriptionStatus = 'Active'
                        expiredAt = new Date()
                        expiredAt.setMonth(
                              expiredAt.getMonth() + getMonths()
                        );
                        createTransaction()
                        break;
                  case 3:
                        /*
                              (3) SUBSCRIPTION_CANCELED
                              - A subscription was either voluntarily
                                or involuntarily canceled.
                                For voluntary cancellation, sent when the user cancels.
                        */
                        inAppSubscriptionStatus = 'Canceled'
                        expiredAt = new Date()
                        createTransaction()
                        break;
                  case 4:
                        /*
                              (4) SUBSCRIPTION_PURCHASED
                              - A new subscription was purchased.
                        */
                        inAppSubscriptionStatus = 'Active'
                        expiredAt = new Date()
                        expiredAt.setMonth(
                              expiredAt.getMonth() + getMonths()
                        );
                        createTransaction()
                        break;
                  case 5:
                        /*
                              (5) SUBSCRIPTION_ON_HOLD
                              - A subscription has entered account hold (if enabled).
                        */
                        break;
                  case 6:
                        /*
                              (6) SUBSCRIPTION_IN_GRACE_PERIOD
                              - A subscription has entered grace period (if enabled).
                        */
                        break;
                  case 7:
                        /*
                              (7) SUBSCRIPTION_RESTARTED
                              - User has restored their subscription from
                                Play > Account > Subscriptions.
                                The subscription was canceled but had not expired yet
                                when the user restores. For more information,
                                see [Restorations](/google/play/billing/subscriptions#restore).
                        */
                        inAppSubscriptionStatus = 'Active'
                        expiredAt = new Date()
                        expiredAt.setMonth(
                              expiredAt.getMonth() + getMonths()
                        );
                        createTransaction()
                        break;
                  case 8:
                        /*
                              (8) SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
                              - A subscription price change has successfully
                                been confirmed by the user.
                        */
                        break;
                  case 9:
                        /*
                              (9) SUBSCRIPTION_DEFERRED
                              - A subscription's recurrence time has been extended.
                        */
                        break;
                  case 10:
                        /*
                              (10) SUBSCRIPTION_PAUSED
                              - A subscription has been paused.
                        */
                        break;
                  case 11:
                        /*
                              (11) SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
                              - A subscription pause schedule has been changed.
                        */
                        break;
                  case 12:
                        /*
                              (12) SUBSCRIPTION_REVOKED
                              - A subscription has been revoked from
                                the user before the expiration time.
                        */
                        inAppSubscriptionStatus = 'Canceled'
                        expiredAt = new Date()
                        createTransaction()
                        break;
                  case 13:
                        /*
                              (13) SUBSCRIPTION_EXPIRED
                              - A subscription has expired.
                        */
                        inAppSubscriptionStatus = 'Canceled'
                        expiredAt = new Date()
                        createTransaction()
                        break;
                  default:
                        break;
            }

            await userService.updateUser(
                  { _id: user._id },
                  {
                        inAppSubscription: {
                              ...user.inAppSubscription,
                              ...inAppPurchaseBody,
                              expiredAt: new Date(expiredAt),
                        },
                        inAppSubscriptionStatus,
                  }
            )
            response.status(200)
                  .send({
                        message: 'OK',
                  });
      } catch ({ message }: any) {
            return next(Boom.badData(message as string))
      }
}

export {
      createTransaction,
      createAppTransaction,
      createGoogleTransaction
};
