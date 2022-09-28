import config from '../../../config'

import { serverOrigins } from '../../constants/app.constant'
const stripe = require('stripe')(config.STRIPE_SECRET);

/** Retrive subscription */
const retrieveSubscription = async (id: string) => {
      try {
            const subscription = await stripe.subscriptions.retrieve(id);
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

/** Create subscription */
const createSubscription = async (planId: string, customerId: string, paymentMethod?: string, status?: string) => {
      try {
            if (paymentMethod) {
                  await updatePaymentMethod(customerId, paymentMethod)
            }
            const subscription = await stripe.subscriptions.create({
                  customer: customerId,
                  items: [
                        { price: planId },
                  ],
                  expand: ['latest_invoice.payment_intent'],
                  trial_period_days: status === 'active' ? 0 : 3
            });
            return subscription
      } catch (error: any) {
            throw new Error(error)
      }
}

/** Update subscription */
const updateSubscription = async (planId: string, subscriptionId: string, customerId?: string, paymentMethod?: string) => {
      try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            if (paymentMethod) {
                  await updatePaymentMethod(customerId, paymentMethod)
            }
            await stripe.subscriptions.update(subscriptionId, {
                  cancel_at_period_end: false,
                  proration_behavior: 'create_prorations',
                  items: [{
                        id: subscription.items.data[0].id,
                        price: planId,
                  }]
            });
      } catch (error: any) {
            throw new Error(error)
      }
}

/** Cancel subscription by id */
const cancelSubscription = async (subscriptionId: string) => {
      await stripe.subscriptions.del(subscriptionId);
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

/** Create subscription webhook */
const createWebhook = async () => {
      if (config.NODE_ENV === 'local') return;
      const url: string = serverOrigins[config.NODE_ENV] + '/api/v1/webhook/transactions';
      const webhooks: any[] = await getWebHookList()
      const existingHook: Object = webhooks?.find(wi => wi.url === url);
      if (existingHook) return;
      const enabled_events: String[] = [
            'customer.subscription.updated',
            'customer.subscription.created'
      ];
      await stripe.webhookEndpoints.create({ url, enabled_events });
      console.log('stripe webhook created successfully')
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

export default {
      retrieveSubscription,
      createSubscription,
      createCustomer,
      cancelSubscription,
      updateSubscription,
      createWebhook,
      getPaymentIntent,
      getPaymentMethod,
      getInvoice,
}
