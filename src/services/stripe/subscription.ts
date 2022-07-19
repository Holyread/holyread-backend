import config from '../../../config'

const stripe = require('stripe')(config.STRIPE_SECRET);

const retrieveSubscription = async (id: string) => {
      try {
            const subscription = await stripe.subscriptions.retrieve(id);
            return subscription
      } catch (error: any) {
            throw new Error(error)
      }
}

const createCustomer = async (email: string, source?: string) => {
      try {
            const name = email.split('@')[0]
            const body: any = {
                  email,
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
            if (source) {
                  body.source = source
            }
            const customer = await stripe.customers.create(body);
            return customer
      } catch (error: any) {
            throw new Error(error)
      }
}

const createSubscription = async (planId: string, customerId: string, paymentMethod?: string) => {
      try {
            if (paymentMethod) {
                  await clearPaymentMethods(customerId)
                  await stripe.paymentMethods.attach(
                        paymentMethod,
                        { customer: customerId }
                  );
                  await stripe.customers.update(customerId, {
                        invoice_settings: {
                              default_payment_method: paymentMethod,
                        },
                  });
            }
            const subscription = await stripe.subscriptions.create({
                  customer: customerId,
                  items: [
                        { price: planId },
                  ],
                  expand: ['latest_invoice.payment_intent'],
                  trial_period_days: 5
            });
            return subscription
      } catch (error: any) {
            throw new Error(error)
      }
}

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

export default {
      retrieveSubscription,
      createSubscription,
      createCustomer
}
