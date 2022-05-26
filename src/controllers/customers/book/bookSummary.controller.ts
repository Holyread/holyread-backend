import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import pdf from 'html-pdf';
import { uploadImageToAwsS3, removeImageToAwsS3 } from '../../../lib/utils/utils'

import bookSummaryService from '../../../services/customers/book/bookSummary.service'
import bookAuthorService from '../../../services/admin/book/author.service'
import { responseMessage } from '../../../constants/message.constant'
import { awsBucket, dataLimit } from '../../../constants/app.constant'
import { getSearchRegexp, sentEmail } from '../../../lib/utils/utils'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse
const authControllerResponse = responseMessage.authControllerResponse

const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.bookDirectory}`,
}

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

        if (data.coverImage) {
            data.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + data.coverImage
        }
        if (data.videoFile) {
            data.videoFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/video/' + data.videoFile
        }
        if (data.chapters && data.chapters.length) {
            data.chapters.forEach(async oneChapter => {
                if (oneChapter.audioFile) {
                    oneChapter.audioFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/audio/' + oneChapter.audioFile
                }
            });
        }
        res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummarySuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Send Summary to kindle */
const sendSummaryToKindle = async (req: any, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        if (!req.user.kindleEmail) {
            return next(Boom.notFound(authControllerResponse.kindleEmailNotExistError))
        }
        /** Get summary from db */
        const data: any = await bookSummaryService.getOneBookSummaryByFilter({ _id: id })
        if (!data) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
        }

        let html = `<style>img {'width': '100px'; hight: '60px';}</style><div style="textAlign: 'center';"><p><h3>Title: ${data.title}</h3></p><br /><p><h5><b>Author: ${data.author.name}</b></h5></p></div><br /><br />`
        if (data.coverImage) {
            data.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + data.coverImage
            html = html + `<div style="textAlign: 'center'; width='100vw'; height='40vh'"><img src=${data.coverImage} style='width="30%"; height="30%"'></img></div><br /><br />`
        }
        if (data.videoFile) {
            data.videoFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/video/' + data.videoFile
        }
        if (data.chapters && data.chapters.length) {
            data.chapters.forEach(async (oneChapter, index) => {
                if (oneChapter.audioFile) {
                    oneChapter.audioFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/audio/' + oneChapter.audioFile
                }
                html = html + `
                <div style="page-break-before:always">&nbsp;</div><div style="textAlign: 'center'; width='100vw';"><p style="font-size:14px;"><b>Chapter ${index} : </b>  ${oneChapter.name}</p><br /><br /><p style="font-size:14px;"><b>Description ${index} :</b> <br />${oneChapter.description}</p><br /></div><br /><br />`
            });
        }
        await pdf.create(html).toBuffer(async (err, buffer) => {
            if (err) return next(Boom.badData(err.message))
            const base64Doc = 'data:application/pdf;base64,' + buffer.toString('base64')
            const fileName: any = await uploadImageToAwsS3(base64Doc, data.title.trim().replace(/ /g, '-'), s3Bucket)
            const fileLink = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory  + '/' + fileName
            const sentEmailRes = await sentEmail(req.user.kindleEmail, 'Convert', 'Sent book to kindle', fileName, fileLink)
            if (!sentEmailRes) {
                return next(Boom.badRequest(bookSummaryControllerResponse.sendBookToKindleEmailFailure))
            }
            await removeImageToAwsS3(fileName, s3Bucket)
            res.status(200).send({ message: bookSummaryControllerResponse.sendBookToKindleSuccess, data: buffer.toString('base64') })
        });
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllSummaries, getOneSummary, sendSummaryToKindle }
