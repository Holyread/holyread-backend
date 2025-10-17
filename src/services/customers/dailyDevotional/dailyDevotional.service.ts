import { DailyDvotionalModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { IDailyDvotional } from '../../../models/dailyDvotional.model'
import { FilterQuery, Types } from 'mongoose'

const NODE_ENV = config.NODE_ENV

/** Get all daily devotional for app */
const getAllDailyDevotional = async (skip: number, limit, search: FilterQuery<IDailyDvotional>, sort, language: Types.ObjectId) => {
    try {
        const query = { ...search, language }
        const dailyDevotionalList: any = await DailyDvotionalModel.find(query).skip(skip).limit(limit).sort(sort).lean()
        const count: any = await DailyDvotionalModel.countDocuments(query).lean().exec()
        dailyDevotionalList.map(async (item: any) => {
            item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + item.image
            if (item.video) {
                item.video = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/video/' + item.video
            }
            if (item.audio) {
                item.audio = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/audio/' + item.audio
            }
        })
        return { count, dailyDevotionalList }
    } catch (e: any) {
        throw new Error(e)
    }
}

const getOneDailyDevotional = async (query: any) => {
    try {
        const data: any = await DailyDvotionalModel.findOne(query).lean().exec()
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllDailyDevotional,
    getOneDailyDevotional,
}
