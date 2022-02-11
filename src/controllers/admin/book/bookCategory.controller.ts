import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookCategoryService from '../../../services/web/book/bookCategory.service'
import { responseMessage } from '../../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3, getSearchRegexp } from '../../../lib/utils/utils'
import { awsBucket, dataTable } from '../../../constants/app.constant'
import config from '../../../../config'

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
        /** Get category from db */
        const category: any = await bookCategoryService.getOneBookCategoryByFilter({ title: req.body.title })
        if (category) {
            return next(Boom.badData(bookCategoryControllerResponse.createBookCategoryFailure))
        }
        if (body.image) {
            body.image = await uploadImageToAwsS3(body.image, body.title, s3Bucket)
        }
        const data = await bookCategoryService.createBookCategory({
            title: body.title,
            image: body.image,
            status: body.status
        })
        res.status(200).send({
            message: bookCategoryControllerResponse.createBookCategorySuccess,
            data
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
        if (data && data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/category/' + data.image
        }
        if (!data) {
            return next(Boom.notFound(bookCategoryControllerResponse.getBookCategoryFailure))
        }
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

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'title': await getSearchRegexp(params.search) },
                    { 'status': await getSearchRegexp(params.search) }
                ]
            }
        }

        const categorySorting = [];
        switch (params.column) {
            case 'title':
                categorySorting.push(['title', params.order || 'ASC']);
                break;
            case 'createdAt':
                categorySorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                categorySorting.push(['title', 'DESC']);
                break;
        }

        const data = await bookCategoryService.getAllBookCategory(Number(skip), Number(limit), searchFilter, categorySorting)
        response.status(200).json({ message: bookCategoryControllerResponse.fetchBookCategoriesSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all book categories options list */
const getAllCategoriesOptionsList = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const data = await bookCategoryService.getAllBookCategoriesNames()
        response.status(200).json({ message: bookCategoryControllerResponse.fetchBookCategoriesSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update book category */
const updateCateogry = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get book category from db */
        const categoryDetails: any = await bookCategoryService.getOneBookCategoryByFilter({ _id: id })
        if (!categoryDetails) {
            return next(Boom.notFound(bookCategoryControllerResponse.getBookCategoryFailure))
        }
        if (req.body.image === null) {
            await removeImageToAwsS3(categoryDetails.image, s3Bucket)
        }
        if (req.body.image && req.body.image.includes('base64')) {
            await removeImageToAwsS3(categoryDetails.image, s3Bucket)
            req.body.image = await uploadImageToAwsS3(req.body.image, categoryDetails.title, s3Bucket)
        }
        if (req.body.image && req.body.image.startsWith('http')) {
            req.body.image = categoryDetails.image
        }
        await bookCategoryService.updateBookCategory(req.body, id)
        return res.status(200).send({ message: bookCategoryControllerResponse.updateBookCategorySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove book category */
const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const bookCategoryDetails: any = await bookCategoryService.getOneBookCategoryByFilter({ _id: id })
        if (bookCategoryDetails && bookCategoryDetails.image) {
            await removeImageToAwsS3(bookCategoryDetails.image, s3Bucket)
        }
        await bookCategoryService.deleteBookCategory(id)
        return res.status(200).send({ message: bookCategoryControllerResponse.deleteBookCategorySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addCategory, getOneCategory, getAllCategory, getAllCategoriesOptionsList, updateCateogry, deleteCategory }
