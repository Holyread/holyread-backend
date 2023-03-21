import config from '../../../config'
import {trailDays}  from '../../constants/app.constant';
import { serverOrigins } from '../../constants/app.constant'
const stripe = require('stripe')(config.STRIPE_SECRET);

/** Retrive subscription */
const retrieveSubscription = async (id: string) => {
      try {
            const subscription = await stripe.subscriptions.retrieve(id);
            if (
                  !subscription
                        ?.latest_invoice
                        ?.id
            ) {
                  try {
                        subscription.latest_invoice =
                              await stripe.invoices.retrieve(
                                    subscription
                                          ?.latest_invoice
                              )
                        if (
                              subscription
                                    ?.latest_invoice
                                    ?.payment_intent
                        ) {
                              subscription.latest_invoice.payment_intent
                                    = await stripe.paymentIntents.retrieve(
                                          subscription
                                                .latest_invoice
                                                .payment_intent
                                    )
                        }
                  } catch ({ message }: any) {
                        console.log(
                              'Failed to fetch invoice details',
                              message
                        )
                  }
            }
            return subscription
      } catch (error: any) {
            throw new Error(error)
      }
}

/** Create user */
const createCustomer = async (email?: string, source?: string) => {
      try {
            const name = email?.split('@')[0] || ''
            const body: any = {
                  name,
                  shipping: {
                        address: {
                              city: 'Brothers',
                              country: 'US',
                              line1: '27 Fredrick Ave',
                              postal_code: '97712',
                              state: 'CA',
                        },
                        name,
                  },
                  address: {
                        city: 'Brothers',
                        country: 'US',
                        line1: '27 Fredrick Ave',
                        postal_code: '97712',
                        state: 'CA',
                  },
                  source
            }
            if (email) {
                  body.email = email
            }
            if (source) {
                  body.source = source
            }
            const customer = await stripe.customers.create(body);
            return customer
      } catch (error: any) {
            throw new Error(error)
      }
}

/** get user */
const getCustomer = async (id: string) => {
      try {
            const customer = await stripe.customers.retrieve(id);
            return customer
      } catch (error: any) {
            return null
      }
}

/** Clear existing payment methods */
const clearPaymentMethods = async (customerId) => {
      const paymentMethods = await stripe.customers.listPaymentMethods(
            customerId,
            { type: 'card' }
      );
      if (!paymentMethods.data.length) return
      await Promise.all(paymentMethods.data.map(async (i: any) => {
            await stripe.paymentMethods.detach(i.id);
      }))
}

/** Update payment method */
const updatePaymentMethod = async (customerId: string, paymentMethod: string) => {
      await clearPaymentMethods(customerId)
      await stripe.paymentMethods.attach(paymentMethod, { customer: customerId });
      await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethod },
      });
}

const createCoupon = async (params: {
      id?: any,
      duration: string,
      expireDate: Date,
      percentOff: number,
      maxRedemptions?: number
}) => {
      try {
            if (
                  !params.percentOff ||
                  params.percentOff < 0 ||
                  params.percentOff > 100
            ) {
                  throw new Error('Invalid coupon discount.');
            }

            const couponObj: any = {
                  id: params.id,
                  redeem_by: parseInt(String(new Date(params.expireDate).getTime() / 1000)),
                  percent_off: params.percentOff,
                  duration: params.duration || 'once',
            };

            if (Number(params.maxRedemptions) > 0) {
                  couponObj.max_redemptions = Number(params.maxRedemptions);
            }

            const coupon = await stripe.coupons.create(couponObj);
            return coupon;
      } catch (error: any) {
            throw new Error(error.message)
      }
};

const getCouponList = async (list = [], startAfter = {}) => {
      try {
            const { data, has_more: hasMore }
                  = await stripe.coupons.list({
                        starting_after: startAfter,
                        limit: 100
                  });
            list = list.concat(data);
            startAfter = data[data.length - 1].id;
            if (!hasMore) return list;
            list = await getCouponList(list, data[data.length - 1].id);
            return list;
      } catch ({ message }: any) {
            return [];
      }
};

const getOneCoupon = async (id: string) => {
      try {
            if (!id) {
                  throw new Error('Invalid coupon id.');
            }
            const coupon = await stripe.coupons.retrieve(id);
            return coupon;
      } catch ({ message }: any) {
            return null;
      }
};

const deleteCoupon = async (id: string) => {
      try {
            if (!id) {
                  throw new Error('Invalid coupon id.');
            }
            await stripe.coupons.del(id);
            return true;
      } catch ({ message }: any) {
            return false;
      }
};

/** Create subscription */
const createSubscription = async (params: {
      planId: string,
      customerId: string,
      paymentMethod?: string,
      status?: string,
      coupon?: any
}) => {
      try {
            if (params.paymentMethod) {
                  await updatePaymentMethod(
                        params.customerId,
                        params.paymentMethod
                  )
            }
            const body: any = {
                  customer: params.customerId,
                  items: [
                        { price: params.planId },
                  ],
                  payment_behavior: 'default_incomplete',
                  expand: ['latest_invoice.payment_intent'],
                  trial_period_days: params.status === 'active' ? 0 : trailDays[config.NODE_ENV]
            }
            if (params.coupon) {
                  const couponList = await getCouponList();
                  const couponCodes = couponList.map(coupon => coupon.id);
                  if (
                        !couponCodes.includes(params.coupon)
                  ) throw new Error('Invalid coupon code');
                  body.coupon = params.coupon
            }
            const subscription = await stripe.subscriptions.create(body);
            return subscription
      } catch (error: any) {
            throw new Error(error)
      }
}

/** Update subscription */
const updateSubscription = async (params: {
      planId: string,
      subscriptionId: string,
      customerId?: string,
      paymentMethod?: string,
      coupon?: any
}) => {
      try {
            const subscription
                  = await stripe.subscriptions.retrieve(
                        params.subscriptionId
                  );
            if (params.paymentMethod) {
                  await updatePaymentMethod(
                        params.customerId,
                        params.paymentMethod
                  )
            }
            const body: any = {
                  cancel_at_period_end: false,
                  proration_behavior: 'create_prorations',
                  items: [{
                        id: subscription.items.data[0].id,
                        price: params.planId,
                  }],
                  payment_behavior: 'default_incomplete',
                  trial_end: 'now'
            }
            if (params.coupon) {
                  body.coupon = params.coupon
            }
            await stripe.subscriptions.update(
                  params.subscriptionId,
                  body
            );
      } catch (error: any) {
            throw new Error(error)
      }
}

/** Cancel subscription by id */
const cancelSubscription = async (subscriptionId: string) => {
      stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
      });
}

/** Get webhooks */
const getWebHookList = async () => {
      try {
            const { data } = await stripe.webhookEndpoints.list();
            return data;
      } catch (e) {
            return null;
      }
};

/** Delete webhooks */
const deleteWebHook = async (id) => {
      try {
            const { deleted } = await stripe.webhookEndpoints.del(id);
            return deleted;
      } catch (e) {
            return null;
      }
};

/** Create subscription webhook */
const createWebhook = async () => {
      const url: string = serverOrigins[config.NODE_ENV] + '/api/v1/webhook/transactions';
      const webhooks: any[] = await getWebHookList()

      let existingHook: boolean = false;
      /** Delete local webhooks */
      webhooks?.map(wi => {
            if (wi.url === url) {
                  existingHook = true
                  return
            }
            if (wi?.url?.includes('ngrok.io') || wi?.url?.includes('localhost')) { deleteWebHook(wi.id) }
      });
      if (existingHook || config.NODE_ENV === 'local') return;

      const enabled_events: String[] = [
            'customer.subscription.updated',
            'customer.subscription.created',
            'invoice.payment_succeeded'
      ];
      await stripe.webhookEndpoints.create({ url, enabled_events });
      console.log('Subscription webhook created successfully')
      return;
}

/** Get invoice by id */
const getInvoice = async (id: string) => {
      try {
            const invoice = await stripe.invoices.retrieve(id);
            return invoice
      } catch (error) {
            return null
      }
}

/** Get invoices */
const getInvoices = async (query: Object, invoices = [], starting_after = {}) => {
      try {
            const { data, has_more }
                  = await stripe.invoices.list({ ...query, starting_after });
            invoices = invoices.concat(data || [])
            if (has_more) {
                  starting_after = invoices[invoices.length - 1].id;
                  getInvoices(query, invoices, starting_after)
            }
            return invoices;
      } catch (error) {
            return []
      }
}

/** Get refunds */
const getRefunds = async (query: Object, refunds = [], starting_after = {}) => {
      try {
            const { data, has_more }
                  = await stripe.refunds.list({ ...query, starting_after });
            refunds = refunds.concat(data || [])
            if (has_more) {
                  starting_after = refunds[refunds.length - 1].id;
                  getRefunds(query, refunds, starting_after)
            } else {
                  refunds.concat(data);
            }
            return refunds;
      } catch (error) {
            return []
      }
}

/** Retrive total profit */
const retrieveProfit = async (duration = 'year') => {
      try {
            let now: Date | Number = new Date();
            now.setHours(0, 0, 0, 0);
            switch (duration) {
                  case 'week':
                        now = (new Date(now).setDate(new Date(now).getDate() - 7) / 1000);
                        break;
                  case 'month':
                        now = (new Date(now).setMonth(new Date(now).getMonth() - 2) / 1000);
                        break;
                  default:
                        now = (new Date(now).setMonth(new Date(now).getMonth() - 12) / 1000);
                        break;
            }
            const query = {
                  limit: 100,
                  status: 'paid',
                  created: { gte: now },
            }
            const invoices = await getInvoices(query);
            delete query.status;
            const refunds = await getRefunds(query);
            const totalInvoice = invoices.reduce((p, c) => {
                  return p + (c.total / 100)
            }, 0);
            const totalRefund = refunds.reduce((p, c) => {
                  return c.status === 'succeed' ? (p + (c.amoun / 100)) : p
            }, 0);
            return Math.trunc(totalInvoice - totalRefund)
      } catch (error: any) {
            throw new Error(error)
      }
}

const createPaymentIntent = async (data: any) => {
      try {
            const paymentIntent = await stripe.paymentIntents.create({
                  ...data
            });
            return paymentIntent
      } catch ({ message }: any) {
            console.log(message)
            return false
      }
}

const confirmPaymentIntent = async (
      paymentIntentId: string,
      paymentMethodId: string
) => {
      try {
            const paymentIntent = await stripe.paymentIntents.confirm(
                  paymentIntentId,
                  { payment_method: paymentMethodId }
            );
            return paymentIntent
      } catch ({ message }: any) {
            console.log(message)
            return false
      }
}

const getPaymentIntents = async (list = [], startAfter = {}) => {
      try {
            const { data, has_more: hasMore }
                  = await stripe.paymentIntents.list({
                        starting_after: startAfter,
                        limit: 100
                  });
            list = list.concat(data);
            startAfter = data[data.length - 1].id;
            if (!hasMore) return list;
            list = await getPaymentIntents(list, data[data.length - 1].id);
            return list;
      } catch ({ message }: any) {
            return [];
      }
};

/** Get payment intent by id */
const getPaymentIntent = async (id: string) => {
      try {
            const paymentIntent = await stripe.paymentIntents.retrieve(id);
            return paymentIntent
      } catch (error) {
            return null
      }
}

/** Get payment method */
const getPaymentMethod = async (id: string) => {
      try {
            const paymentMethod = await stripe.paymentMethods.retrieve(id);
            return paymentMethod
      } catch (error) {
            return null
      }
}

/** Create ephemeral key  */
const createEphemeralKey = async (customerId: string) => {
      try {
            return await stripe.ephemeralKeys.create(
                  { customer: customerId },
                  { apiVersion: '2020-03-02' }
            );
      } catch (error) {
            return null
      }
}

export default {
      getInvoice,
      getCustomer,
      createCoupon,
      deleteCoupon,
      getOneCoupon,
      getCouponList,
      createWebhook,
      retrieveProfit,
      createCustomer,
      getPaymentIntent,
      getPaymentMethod,
      getPaymentIntents,
      cancelSubscription,
      createSubscription,
      createEphemeralKey,
      updateSubscription,
      createPaymentIntent,
      updatePaymentMethod,
      confirmPaymentIntent,
      retrieveSubscription,
}
