import { FilterQuery, Types } from 'mongoose';
import { IMeditationCategory } from '../../../models/meditationCategory.model';
import { MeditationCategoryModel } from '../../../models/index'
import { formattedDate, getImageUrl } from '../../../lib/utils/utils'
import { awsBucket } from '../../../constants/app.constant'

/** Create Story */
const createMeditationCategory = async (body: any) => {
    try {
        body.status = 'Active'
        const result: any = await MeditationCategoryModel.create(body)
        if (result.image) result.image = getImageUrl(result.image, `${awsBucket.meditationDirectory}/category`);
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

const updateMeditationCategory = async (body: any, id: string) => {
    try {
        const result: any = await MeditationCategoryModel.findOneAndUpdate(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        ).lean();

        if (result && result.image) result.image = getImageUrl(result.image, `${awsBucket.meditationDirectory}/category`);
        return result;
    } catch (e: any) {
        throw new Error(e.message);
    }
}


/** Get one Story by filter */
const getOneMeditationCategoryByFilter = async (query: any) => {
    try {
        const result: any = await MeditationCategoryModel.findOne(query).lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all Stories for table */
const getAllMeditationCategories = async (skip: number, limit, search: FilterQuery<IMeditationCategory>, sort, language: Types.ObjectId) => {
    try {
        const query = { ...search };
        if (language) {
            query.language = language;
        }
        const result: any = await MeditationCategoryModel.find(query).skip(skip).limit(limit).sort(sort).lean()
        await Promise.all(result.map(async (item: any) => {
            item.createdAt = formattedDate(item.createdAt).replace(/ /g, ' ')
            if (item.image) item.image = getImageUrl(item.image, `${awsBucket.meditationDirectory}/category`);
        }))
        const count = await MeditationCategoryModel.find(query).countDocuments()
        return { count, categories: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

const getAllMeditationCategoriesList = async (language: Types.ObjectId) => {
    try {
        const result: any = await MeditationCategoryModel.find({ language }).select('title').lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}
/** Remove Story */
const deleteMeditationCategory = async (id: string) => {
    try {
        await MeditationCategoryModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createMeditationCategory,
    updateMeditationCategory,
    getOneMeditationCategoryByFilter,
    getAllMeditationCategories,
    deleteMeditationCategory,
    getAllMeditationCategoriesList
}
