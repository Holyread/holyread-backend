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

const createCustomer = async (email: string, source: string) => {
      try {
            const name = email.split('@')[0]
            const customer = await stripe.customers.create({
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
            });
            return customer
      } catch (error: any) {
            throw new Error(error)
      }
}


const createSubscription = async (planId: string, customerId: string) => {
      try {
            const subscription = await stripe.subscriptions.create({
                  customer: customerId,
                  items: [
                        { price: planId },
                  ],
                  payment_behavior: 'default_incomplete',
                  expand: ['latest_invoice.payment_intent'],
            });
            return subscription
      } catch (error: any) {
            throw new Error(error)
      }
}

export default {
      retrieveSubscription,
      createSubscription,
      createCustomer
}