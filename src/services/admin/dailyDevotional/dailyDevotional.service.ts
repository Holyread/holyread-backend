import { DailyDvotionalModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import { responseMessage } from '../../../constants/message.constant'
import { formattedDate, getImageUrl } from '../../../lib/utils/utils'
import { IDailyDvotional } from '../../../models/dailyDvotional.model'
import { FilterQuery } from 'mongoose'

const dailyDevotionalControllerResponse = responseMessage.dailyDevotionalControllerResponse

/** Add Daily Devotional */
const createDailyDevotional = async (body: any) => {
    try {
        const result = await DailyDvotionalModel.create(body)

        if (!result) throw new Error(dailyDevotionalControllerResponse.createDailyDevotionalFailure)
        if (result.image) result.image = getImageUrl(result.image, awsBucket.readsOfDayDirectory);
        if (result.video) result.video = getImageUrl(result.video, `${awsBucket.readsOfDayDirectory}/video`);
        if (result.audio) result.audio = getImageUrl(result.audio, `${awsBucket.readsOfDayDirectory}/audio`);

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
        if (data) {
            if (data.image) data.image = getImageUrl(data.image, awsBucket.readsOfDayDirectory);
            if (data.video) data.video = getImageUrl(data.video, `${awsBucket.readsOfDayDirectory}/video`);
            if (data.audio) data.audio = getImageUrl(data.audio, `${awsBucket.readsOfDayDirectory}/audio`);

        }
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get Daily Devotional BY id */
const getOneDailyDevotionalByFilter = async (query: any) => {
    try {
        const data: any = await DailyDvotionalModel.findOne(query).lean()
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all Daily Devotional for table */
const getAllDailyDevotional = async (skip: number, limit: number, search: FilterQuery<IDailyDvotional>, sort: any) => {
    try {
        const result: any = await DailyDvotionalModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        await Promise.all(result.map(async (item: any) => {
            item.createdAt = formattedDate(item.createdAt).replace(/ /g, ' ')
            item.image = getImageUrl(item.image, awsBucket.readsOfDayDirectory);
            if (item.video) item.video = getImageUrl(item.video, `${awsBucket.readsOfDayDirectory}/video`);
            if (item.audio) item.audio = getImageUrl(item.audio, `${awsBucket.readsOfDayDirectory}/audio`);
        }))
        const count = await DailyDvotionalModel.countDocuments(search)
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
        await Promise.all(result.map(async (i: any) => {
            i.createdAt = formattedDate(i.createdAt).replace(/ /g, ' ')
        }))
        if (result.length) {
            await Promise.all(result.map((item: any) => {
                if (item && typeof item.publish === 'boolean') {
                    item.publish = item.publish ? 'Publish' : 'Pending';
                }
            }));
        }
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
