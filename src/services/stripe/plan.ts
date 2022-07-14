import config from '../../../config'

const stripe = require('stripe')(config.STRIPE_SECRET);

const createPlan = async (title: string, price: number, interval: string, intervalCount: number) => {
      try {
            const body: any = {
                  amount: price * 100,
                  currency: 'usd',
                  interval: interval.toLowerCase(),
                  product: { name: title }
            }
            if (intervalCount) {
                  body.interval_count = intervalCount
            }
            const planDetails = await stripe.plans.create(body)
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

const addPrice = async (productId: string, price: number, interval: string, intervalCount: number) => {
      try {
            const productPrices = await getProductPrices(productId)
            let productPrice = null
            if (productPrices.data && productPrices.data.length) {
                  productPrice = await productPrices.data.find(onePrice => onePrice.unit_amount === price)
            }
            if (!productPrice) {
                  productPrice = await stripe.prices.create({
                        unit_amount: Number((price * 100).toFixed(2)),
                        currency: 'usd',
                        recurring: { interval: interval.toLowerCase(), interval_count: intervalCount },
                        product: productId,
                  });
            }
            await stripe.products.update(
                  productId,
                  { default_price: productPrice.id }
            );
            return productPrice
      } catch (error: any) {
            throw new Error(error)
      }
}


const getProductPrices = async (productId: string) => {
      try {
            const productPrices = await stripe.prices.list({
                  product: productId,
            });
            return productPrices
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