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

const createCharge = async (id: string, amount: number) => {
      try {
            const charge = await stripe.charges.create({
                  amount: amount * 100,
                  currency: 'usd',
                  source: id,
                  capture: false,
            });
            return charge
      } catch (error: any) {
            throw new Error(error)
      }
}

export default {
      retrieveSubscription,
      createCharge
}