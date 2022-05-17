import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import aws from 'aws-sdk';

import bookSummaryService from '../../../services/customers/book/bookSummary.service'
import bookAuthorService from '../../../services/admin/book/author.service'
import { responseMessage } from '../../../constants/message.constant'
import { awsBucket, dataLimit } from '../../../constants/app.constant'
import { bytesToSize, getSearchRegexp } from '../../../lib/utils/utils'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

/** Get all book summary by for discover */
const getAllSummaries = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        let bookSearchFilter: any = { status: 'Active' }
        let authorSearchFilter: any = {}
        if (params.category) {
            bookSearchFilter.categories = String(params.category)
        }
        if (params.search) {
            bookSearchFilter.filter = String(params.search).toLowerCase().trim()
            authorSearchFilter.name = await getSearchRegexp(params.search)
        }
        if (params.author) {
            bookSearchFilter.author = params.author
        }
        const bookSummariesList: any = await bookSummaryService.getAllBookSummariesForDiscover(Number(skip), Number(limit), bookSearchFilter, [['createdAt', 'DESC']])
        if (params.author) {
            response.status(200).json({
                message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
                data: bookSummariesList
            })
            return    
        }
        const authorsList: any = await bookAuthorService.getAllAuthors(Number(skip), Number(limit), authorSearchFilter, [['createdAt', 'DESC']])
        response.status(200).json({
            message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
            data: { books: bookSummariesList, authors: authorsList }
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
        const s3 = new aws.S3({
            secretAccessKey: config.AWS_SECRET,
            accessKeyId: config.AWS_ACCESSKEY,
            region: awsBucket.region,
        })
        /** Get S3 bucket files contents  */
        const s3BooksContents = await s3.listObjectsV2({
            Bucket: 'holyreads-develop',
            Prefix: 'books'
        }).promise();

        if (data.coverImage) {
            data.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + data.coverImage
        }
        if (data.videoFile) {
            const videoFileSize = s3BooksContents.Contents.find(oneContent => oneContent.Key.includes('video/' + data.videoFile))?.Size || 0
            data.videoFileSize = bytesToSize(videoFileSize)
            data.videoFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/video/' + data.videoFile
        }
        if (data.chapters && data.chapters.length) {
            data.chapters.forEach(async oneChapter => {
                if (oneChapter.audioFile) {
                    const audeoFileSize = s3BooksContents.Contents.find(oneContent => oneContent.Key.includes('audio/' + oneChapter.audioFile))?.Size || 0
                    oneChapter.audeoFileSize = bytesToSize(audeoFileSize)
                    oneChapter.audioFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/audio/' + oneChapter.audioFile
                }
            });
        }
        res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummarySuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllSummaries, getOneSummary }
