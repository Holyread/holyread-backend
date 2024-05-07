import { DailyDvotionalModel } from '../../../models'

/** Get daily devotional by id */
const getOneDailyDevotional = async (query: any) => {
    try {
          const data: any = await DailyDvotionalModel.findOne(query).lean().exec()
          return data
    } catch (e: any) {
          throw new Error(e)
    }
}

export default {
    getOneDailyDevotional,
}
