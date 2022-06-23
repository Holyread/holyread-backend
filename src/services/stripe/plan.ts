import config from '../../../config'

const stripe = require('stripe')(config.STRIPE_SECRET);

const createPlan = async (title: string, price: number, interval: string) => {
      try {
            const planDetails = await stripe.plans.create({
                  amount: price * 100,
                  currency: 'usd',
                  interval,
                  product: { name: title }
            })
            return planDetails
      } catch (error: any) {
            throw new Error(error)
      }
}

const retrievePlan = async (planId: string) => {
      try {
            const planDetails = await stripe.plans.retrieve(planId);
            return planDetails
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
      createPlan,
      retrievePlan,
      deletePlanById,
      addPrice
}