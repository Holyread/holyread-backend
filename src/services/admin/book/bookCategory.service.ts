import { BookCategoryModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import { responseMessage } from '../../../constants/message.constant'
import { getImageUrl } from '../../../lib/utils/utils'
import { IBookCategory } from '../../../models/bookCategory.model'
import { FilterQuery } from 'mongoose'

const bookCategoryControllerResponse = responseMessage.bookCategoryControllerResponse

/** Add Book Category */
const createBookCategory = async (body: any) => {
    try {
        const result = await BookCategoryModel.create(body)
        if (!result) throw new Error(bookCategoryControllerResponse.createBookCategoryFailure)
        if (result.image) result.image = getImageUrl(result.image, `${awsBucket.bookDirectory}/category`);
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify book category */
const updateBookCategory = async (body: any, id: string) => {
    try {
        const data: any = await BookCategoryModel.findOneAndUpdate(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        )
        if (data && data.image) data.image = getImageUrl(data.image, `${awsBucket.bookDirectory}/category`);
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get book category by category id */
const getOneBookCategoryByFilter = async (query: any) => {
    try {
        const result: any = await BookCategoryModel.findOne(query).lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all book category for table */
const getAllBookCategory = async (skip: number, limit, search: FilterQuery<IBookCategory>, sort) => {
    try {
        const result = await BookCategoryModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count = await BookCategoryModel.find(search).countDocuments()
        await Promise.all(result.map(async (item: any) => {
            if (!item) return
            if (item.image) item.image = getImageUrl(item.image, `${awsBucket.bookDirectory}/category`);
        }))
        return { count, categories: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all book categories names */
const getAllBookCategoriesNames = async () => {
    try {
        const result = await BookCategoryModel.find({}).select('title').lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove category */
const deleteBookCategory = async (id: string) => {
    try {
        await BookCategoryModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createBookCategory,
    updateBookCategory,
    getAllBookCategory,
    getAllBookCategoriesNames,
    getOneBookCategoryByFilter,
    deleteBookCategory,
}
