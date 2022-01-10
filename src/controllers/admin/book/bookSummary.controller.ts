import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookCategoryService from '../../../services/book/bookCategory.service'
import bookSummaryService from '../../../services/book/bookSummary.service'
import { responseMessage } from '../../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3, getSearchRegexp } from '../../../lib/utils/utils'
import { awsBucket, dataTable } from '../../../constants/app.constant'
import config from '../../../../config'

const bookCategoryControllerResponse = responseMessage.bookCategoryControllerResponse
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.bookDirectory}`,
}

/** Add book summary */
const addSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        console.log(Object.keys(body))
        /** Get book summary from db */
        const summaryDetails: any = await bookSummaryService.getOneBookSummaryByFilter({ title: req.body.title })
        if (summaryDetails) {
            return next(Boom.badData(bookSummaryControllerResponse.createBookSummaryFailure))
        }
        const categoryDetails: any = await bookCategoryService.getOneBookCategoryByFilter({ _id: req.body.category })
        if (!categoryDetails) {
            return next(Boom.badData(bookCategoryControllerResponse.getBookCategoryFailure))
        }
        if (body.coverImage) {
            body.coverImage = await uploadImageToAwsS3(body.coverImage, body.title, s3Bucket)
        }
        if (body.audioFile) {
            body.audioFile = await uploadImageToAwsS3(body.audioFile, body.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory })
        }
        if (body.videoFile) {
            body.videoFile = await uploadImageToAwsS3(body.videoFile, body.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory })
        }
        const data = await bookSummaryService.createBookSummary(body)
        res.status(200).send({
            message: bookSummaryControllerResponse.createBookSummarySuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one book summary by id */
const getOneSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get summary from db */
        const data: any = await bookSummaryService.getOneBookSummaryByFilter({ _id: id })
        if (!data) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
        }
        if (data.category) {
            const categoryDetails = await bookCategoryService.getOneBookCategoryByFilter({ _id: data.category })
            data.category = categoryDetails.title
        }
        res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummarySuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all book summary by filter */
const getAllSummaries = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'title': await getSearchRegexp(params.search) },
                    { 'status': await getSearchRegexp(params.search) },
                    { 'author': await getSearchRegexp(params.search) },
                    { 'description': await getSearchRegexp(params.search) },
                    { 'overview': await getSearchRegexp(params.search) },
                    { 'bookFor': await getSearchRegexp(params.search) },
                    { 'aboutAuthor': await getSearchRegexp(params.search) },
                    { 'chapters.name': await getSearchRegexp(params.search) }
                ]
            }
        }
        const summarySorting = [];
        switch (params.column) {
            case 'title':
                summarySorting.push(['title', params.order || 'ASC']);
                break;
            case 'status':
                summarySorting.push(['status', params.order || 'ASC']);
                break;
            case 'author':
                summarySorting.push(['author', params.order || 'ASC']);
                break;
            case 'createdAt':
                summarySorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                summarySorting.push(['title', 'DESC']);
                break;
        }

        const data = await bookSummaryService.getAllBookSummaries(Number(skip), Number(limit), searchFilter, summarySorting)
        response.status(200).json({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update book summary */
const updateSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get book summary from db */
        const summaryDetails: any = await bookSummaryService.getOneBookSummaryByFilter({ _id: id })
        if (!summaryDetails) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
        }
        if (req.body.coverImage === null) {
            await removeImageToAwsS3(summaryDetails.coverImage, s3Bucket)
        }
        if (req.body.coverImage) {
            await removeImageToAwsS3(summaryDetails.coverImage, s3Bucket)
            req.body.coverImage = await uploadImageToAwsS3(req.body.coverImage, summaryDetails.title, s3Bucket)
        }
        if (req.body.audioFile === null) {
            await removeImageToAwsS3(summaryDetails.audioFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio'  })
        }
        if (req.body.audioFile) {
            await removeImageToAwsS3(summaryDetails.audioFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio'  })
            req.body.audioFile = await uploadImageToAwsS3(req.body.audioFile, summaryDetails.title, s3Bucket)
        }
        if (req.body.videoFile === null) {
            await removeImageToAwsS3(summaryDetails.videoFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video'  })
        }
        if (req.body.videoFile) {
            await removeImageToAwsS3(summaryDetails.videoFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video'  })
            req.body.videoFile = await uploadImageToAwsS3(req.body.videoFile, summaryDetails.title, s3Bucket)
        }
        await bookCategoryService.updateBookCategory(req.body, id)
        return res.status(200).send({ message: bookCategoryControllerResponse.updateBookCategorySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove book summary */
const deleteSummary = async (req: Request, res: Response, next: NextFunction) => {
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

export { addSummary, getOneSummary, getAllSummaries, updateSummary, deleteSummary }
