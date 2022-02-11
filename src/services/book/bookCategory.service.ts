import { BookCategoryModel } from '../../models/index'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'
import { responseMessage } from '../../constants/message.constant'

const NODE_ENV = config.NODE_ENV
const bookCategoryControllerResponse = responseMessage.bookCategoryControllerResponse

/** Add Book Category */
const createBookCategory = async (body: any) => {
    try {
        const result = await BookCategoryModel.create(body)
        if (!result) {
            throw new Error(bookCategoryControllerResponse.createBookCategoryFailure)
        }
        if (result.image) {
            result.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/category/' + result.image
        }
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
        if (data && data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/category/' + data.image
        }
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
const getAllBookCategory = async (skip: number, limit, search: object, sort) => {
    try {
        const result = await BookCategoryModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count = await BookCategoryModel.find(search).count()
        await Promise.all(result.map(async (item: any) => {
            if (!item) {
                return
            }
            if (item.image) {
                item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/category/' + item.image
            }
        }))
        return { count, categories: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all book categories options list */
const getAllBookCategoriesOptionsList = async () => {
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
    getAllBookCategoriesOptionsList,
    getOneBookCategoryByFilter,
    deleteBookCategory
}
