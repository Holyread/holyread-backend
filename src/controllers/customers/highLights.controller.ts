import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import highLightsService from '../../services/customers/highLights/highLights.service'
import bookSummaryService from '../../services/admin/book/bookSummary.service'
import { responseMessage } from '../../constants/message.constant'

const highLightsControllerResponse = responseMessage.highLightsControllerResponse
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

/** Add high light */
const addHighLight = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const bookDetails = await bookSummaryService.getOneBookSummaryByFilter({
            _id: body.bookId, 'chapters._id': body.chapterId
        })
        if (!bookDetails) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
        }
        const data = await highLightsService.createHighLight(body)
        res.status(200).send({
            message: highLightsControllerResponse.createHighLightSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get high lights by category id */
const getHighLightsByFilter = async (skip: number, limit, search: object, sort) => {
    try {
        const result: any = await HighLightsModel.find(search).populate('bookId', 'title coverImage author overview').skip(skip).limit(limit).sort(sort).lean().exec()
        await Promise.all(await result.map(async (item: any) => {
            item.bookId = Object.assign({}, { ...item.bookId, coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + item.bookId.coverImage })
            if (item && item.bookId && item.bookId.author) {
                item.bookId.author = await BookAuthorModel.findOne({ _id: item.bookId.author }).lean().exec()
            }
        }))
        const count: any = await HighLightsModel.count(search).lean().exec()
        return { highLightsBooks: result, count }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Update high light */
const updateHighLight = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { highLightId } = req.params
        await highLightsService.updateHighLight(req.body, highLightId)
        return res.status(200).send({ message: highLightsControllerResponse.updateHighLightSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove high light */
const deleteHighLight = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const highLightId = req.params.highLightId
        await highLightsService.deleteHighLight(id, highLightId)
        return res.status(200).send({ message: highLightsControllerResponse.deleteHighLightSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addHighLight, getHighLightsByFilter, updateHighLight, deleteHighLight }
