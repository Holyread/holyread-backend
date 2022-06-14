import config from '../../../config'
import { origins } from '../../constants/app.constant'

const NODE_ENV = config.NODE_ENV

const stripe = require('stripe')(config.STRIPE_SECRET);

const createSession = async (userId, planId, subscription) => {
      try {
            const session = await stripe.checkout.sessions.create({
                  success_url: origins[NODE_ENV] + '/pages/settings' + '?userid=' + userId + '&payment=true&subscription=' + subscription,
                  cancel_url: origins[NODE_ENV] + '/pages/settings?payment=false',
                  'payment_method_types': ['card'],
                  mode: 'subscription',
                  line_items: [
                        { price: planId, quantity: 1 },
                  ],
            });
            return session
      } catch (error) {
            console.log('create session error - ', error)
            return false
      }
}

const retrieveSession = async (id: string) => {
      try {
            const session = await stripe.checkout.sessions.retrieve(id);
            return session
      } catch (error: any) {
            throw new Error(error)
      }
}

const deletePlanById = async (planId: string) => {
      try {
            const { deleted } = await stripe.plans.del(planId);
            return deleted
      } catch (error: any) {
            throw new Error(error)
      }
}

const addPrice = async (productId: string, price: number, interval: string) => {
      try {
            const productPrice = await stripe.prices.create({
                  unit_amount: price * 100,
                  currency: 'usd',
                  recurring: { interval },
                  product: productId,
            });
            return productPrice
      } catch (error: any) {
            throw new Error(error)
      }
}

export default {
      createSession,
      retrieveSession,
      deletePlanById,
      addPrice
}