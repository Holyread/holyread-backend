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

const retrieveToken = async (id: string) => {
      try {
            // const token = await stripe.tokens.retrieve(id);
            const token = await stripe.tokens.create({
                  card: {
                        number: '4242424242424242',
                        exp_month: 6,
                        exp_year: 2023,
                        cvc: '314',
                  },
            });
            const charge = await stripe.charges.create({
                  amount: 500,
                  currency: 'usd',
                  source: token.id,
                  capture: false,
                });
            return { token, charge }
      } catch (error: any) {
            throw new Error(error)
      }
}

const createPaymentIntent = async () => {
      const paymentIntent = await stripe.paymentIntents.create({
            amount: 50,
            currency: "usd",
            automatic_payment_methods: {
                  enabled: true,
            },
      });
      return paymentIntent.client_secret
}

export default {
      retrieveSubscription,
      retrieveToken,
      createPaymentIntent
}