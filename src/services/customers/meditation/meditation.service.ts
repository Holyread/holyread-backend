import { MeditationCategoryModel, MeditationModel } from '../../../models/index'
import { getImageUrl } from '../../../lib/utils/utils'
import { awsBucket } from '../../../constants/app.constant'
import { IMeditation } from '../../../models/meditation.model'
import { FilterQuery } from 'mongoose'

const getAllMeditations = async (search: FilterQuery<IMeditation>) => {
    try {
        const result: any = await MeditationModel.find(search).populate('category').lean()
        await Promise.all(result.map(async (item: any) => {
            if (item.image) item.image = getImageUrl(item.image, `${awsBucket.meditationDirectory}`);
            if (item.video) item.video = getImageUrl(item.video, `${awsBucket.meditationDirectory}/video`);
            if (item.category) { item.category = item.category.title }
        }))
        const count = await MeditationModel.find(search).countDocuments()
        return { count, meditations: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

const getAllMeditationCategoriesList = async () => {
    try {
        const result: any = await MeditationCategoryModel.find().lean()
        const count = await MeditationCategoryModel.find().countDocuments()
        return { count, meditationCategories: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

const getRecommendedMeditation = async () => {
    return MeditationModel.aggregate([{ $sample: { size: 1 } }]).exec();
};

export default {
    getAllMeditations,
    getAllMeditationCategoriesList,
    getRecommendedMeditation
}
