import { SubscriberModel } from "../../../models"


/** Create subscriber */
const createSubscriber = async (body: any) => {
    try {
          const result: any = await SubscriberModel.create(body)
          return result
    } catch (e: any) {
          throw new Error(e)
    }
}

/** Get one subscriber by filter */
const getOneSubscriberByFilter = async (query: any) => {
    try {
          const result: any = await SubscriberModel.findOne(query).lean()
          return result
    } catch (e: any) {
          throw new Error(e)
    }
}

export default {
    createSubscriber,
    getOneSubscriberByFilter
}
