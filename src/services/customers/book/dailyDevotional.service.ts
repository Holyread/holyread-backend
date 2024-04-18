import { ReadsOfDayModel } from "../../../models"

/** Get daily devotional by id */
const getOneDailyDevotional = async (query: any) => {
    try {
          const data: any = await ReadsOfDayModel.findOne(query).lean().exec()
          return data
    } catch (e: any) {
          throw new Error(e)
    }
}

export default {
    getOneDailyDevotional,
}
