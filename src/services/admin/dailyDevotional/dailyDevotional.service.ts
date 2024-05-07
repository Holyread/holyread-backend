import { DailyDvotionalModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { responseMessage } from '../../../constants/message.constant'
import { formattedDate } from '../../../lib/utils/utils'

const NODE_ENV = config.NODE_ENV
const dailyDevotionalControllerResponse = responseMessage.dailyDevotionalControllerResponse

/** Add Daily Devotional*/
const createDailyDevotional = async (body: any) => {
    try {
        const result = await DailyDvotionalModel.create(body)
        if (!result) {
            throw new Error(dailyDevotionalControllerResponse.createDailyDevotionalFailure)
        }
        if (result.image) {
            result.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + result.image
        }
        if (result.video) {
            result.video = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/video/' + result.video
        }
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify Daily Devotional */
const updateDailyDevotional = async (body: any, id: string) => {
    try {
        const data: any = await DailyDvotionalModel.findOneAndUpdate(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        )
        if (data && data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + data.image
        }

        if (data && data.video) {
            data.video = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/video/' + data.video
        }
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get Daily Devotional BY id */
const getOneDailyDevotionalByFilter = async (query: any) => {
    try {
        const result: any = await DailyDvotionalModel.findOne(query).lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all Daily Devotional for table */
const getAllDailyDevotional = async (skip: number, limit, search: object, sort) => {
    try {
        const result: any = await DailyDvotionalModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        await result.map(async (item: any) => {
            item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + item.image

            if (item.video) {
                item.video = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/video/' + item.video
            }
        })
        const count = await DailyDvotionalModel.find(search).countDocuments()
        await result.map(i => {
            i.createdAt = formattedDate(i.createdAt).replace(/ /g, ' ')
        })

        return { count, reads: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove  Daily Devotional  */
const deleteDailyDevotional = async (id: string) => {
    try {
        await DailyDvotionalModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all  Daily Devotional for table */
const getDailyDevotionalList = async () => {
    try {
        const result: any = await DailyDvotionalModel.find().lean()
        await result.map(i => {
            i.createdAt = formattedDate(i.createdAt).replace(/ /g, ' ')
        })
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createDailyDevotional,
    updateDailyDevotional,
    getOneDailyDevotionalByFilter,
    getAllDailyDevotional,
    deleteDailyDevotional,
    getDailyDevotionalList,
}
