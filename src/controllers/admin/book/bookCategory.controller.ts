import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookCategoryService from '../../../services/admin/book/bookCategory.service'
import { responseMessage } from '../../../constants/message.constant'
import { removeS3File, uploadFileToS3, getSearchRegexp, getImageUrl } from '../../../lib/utils/utils'
import { awsBucket, dataTable } from '../../../constants/app.constant'
import config from '../../../../config'
import { IBookCategory } from '../../../models/bookCategory.model';
import { FilterQuery } from 'mongoose';

const bookCategoryControllerResponse = responseMessage.bookCategoryControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.bookDirectory}/category`,
}

/** Add book category */
const addCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const language = (req as any).languageId;
        /** Get category from db */
        const category: any = await bookCategoryService.getOneBookCategoryByFilter({ title: req.body.title, language })
        if (category) return next(Boom.badData(bookCategoryControllerResponse.createBookCategoryFailure))

        if (body.image) {
            const s3File: any = await uploadFileToS3(body.image, body.title, s3Bucket)
            body.image = s3File.name
        }
        const data = await bookCategoryService.createBookCategory({
            title: body.title,
            image: body.image,
            status: body.status,
            language: language,
        })
        res.status(200).send({
            message: bookCategoryControllerResponse.createBookCategorySuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one category by id */
const getOneCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get category from db */
        const data: any = await bookCategoryService.getOneBookCategoryByFilter({ _id: id })
        if (!data) return next(Boom.notFound(bookCategoryControllerResponse.getBookCategoryFailure))
        if (data && data.image) data.image = getImageUrl(data.image, `${awsBucket.bookDirectory}/category`);
        res.status(200).send({ message: bookCategoryControllerResponse.fetchBookCategorySuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all book category by filter */
const getAllCategory = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit
        const language = (request as any).languageId;
        let searchFilter: FilterQuery<IBookCategory> = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'title': await getSearchRegexp(params.search) },
                    { 'status': await getSearchRegexp(params.search) },
                ],
            }
        }

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const categorySorting = ['title', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['title', 'desc']];
        const data = await bookCategoryService.getAllBookCategory(Number(skip), Number(limit), searchFilter, categorySorting, language)
        response.status(200).json({ message: bookCategoryControllerResponse.fetchBookCategoriesSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all book categories options list */
const getAllCategoriesOptionsList = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const language = (request as any).languageId;
        const data = await bookCategoryService.getAllBookCategoriesNames(language)
        response.status(200).json({ message: bookCategoryControllerResponse.fetchBookCategoriesSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update book category */
const updateCateogry = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: string = req.params.id
        /** Get book category from db */
        const categoryDetails: any = await bookCategoryService.getOneBookCategoryByFilter({ _id: id })
        const language = (req as any).languageId;
        if (!categoryDetails) return next(Boom.notFound(bookCategoryControllerResponse.getBookCategoryFailure))
        if (req.body.image === null) await removeS3File(categoryDetails.image, s3Bucket)
        if (req.body.image && req.body.image.includes('base64')) {
            await removeS3File(categoryDetails.image, s3Bucket)
            const s3File: any = await uploadFileToS3(req.body.image, categoryDetails.title, s3Bucket)
            req.body.image = s3File.name
        }
        if (req.body.image && req.body.image.startsWith('http')) req.body.image = categoryDetails.image
        req.body.language = language;
        await bookCategoryService.updateBookCategory(req.body, id)
        return res.status(200).send({ message: bookCategoryControllerResponse.updateBookCategorySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove book category */
const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: any = req.params.id
        const bookCategoryDetails = await bookCategoryService.getOneBookCategoryByFilter({ _id: id })
        if (bookCategoryDetails && bookCategoryDetails.image) await removeS3File(bookCategoryDetails.image, s3Bucket)
        await bookCategoryService.deleteBookCategory(id)
        return res.status(200).send({ message: bookCategoryControllerResponse.deleteBookCategorySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addCategory, getOneCategory, getAllCategory, getAllCategoriesOptionsList, updateCateogry, deleteCategory }
