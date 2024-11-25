import { FilterQuery } from 'mongoose';
import { IMeditation } from '../../../models/meditation.model';
import { MeditationModel } from '../../../models/index'
import { formattedDate, getImageUrl } from '../../../lib/utils/utils'
import { awsBucket } from '../../../constants/app.constant'

/** Create Meditation */
const createMeditation = async (body: any) => {
    try {
        body.status = 'Active'
        const result: any = await MeditationModel.create(body)
        if (result.image) result.image = getImageUrl(result.image, `${awsBucket.meditationDirectory}`);
        if (result.video) result.video = getImageUrl(result.video, `${awsBucket.meditationDirectory}/video`);
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

const updateMeditation = async (body: any, id: string) => {
    try {
        const result: any = await MeditationModel.findOneAndUpdate(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        ).lean();

        if (result && result.image) result.image = getImageUrl(result.image, `${awsBucket.meditationDirectory}`);
        if (result && result.video) result.video = getImageUrl(result.video, `${awsBucket.meditationDirectory}/video`);
        return result;
    } catch (e: any) {
        throw new Error(e.message);
    }
}


/** Get one Meditation by filter */
const getOneMeditationByFilter = async (query: any) => {
    try {
        const result: any = await MeditationModel.findOne(query).lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all Meditations for table */
const getAllMeditations = async (skip: number, limit, search: FilterQuery<IMeditation>, sort) => {
    try {
        const result: any = await MeditationModel.find(search).populate('category').skip(skip).limit(limit).sort(sort).lean()
        await Promise.all(result.map(async (item: any) => {
            item.createdAt = formattedDate(item.createdAt).replace(/ /g, ' ')
            if (item.image) item.image = getImageUrl(item.image, `${awsBucket.meditationDirectory}`);
            if (item.video) item.video = getImageUrl(item.video, `${awsBucket.meditationDirectory}/video`);
            if (item.category) item.category = item.category.title
        }))
        const count = await MeditationModel.find(search).countDocuments()
        return { count, meditations: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove Meditation */ 
const deleteMeditation = async (id: string) => {
    try {
        await MeditationModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createMeditation,
    updateMeditation,
    getOneMeditationByFilter,
    getAllMeditations,
    deleteMeditation
}
