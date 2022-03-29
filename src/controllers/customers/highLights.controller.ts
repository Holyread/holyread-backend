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
        console.log({
            _id: body.bookId, 'chapters._id': body.chapterId
        })
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

/**  Get high lights by filter */
const getHighLightsByFilter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let filter = {}
        let params = req.query
        if (params.userId && params.bookId, params.chapterId) {
            filter = {
                bookId: params.bookId,
                chapterId: params.chapterId
            }
        }
        /** Get high lights from db */
        const data: any = await highLightsService.getHighLightsByFilter(filter)
        res.status(200).send({ message: highLightsControllerResponse.fetchHighLightsSuccess, data: params.bookId && data.length ? data[0] : data })
    } catch (e: any) {
        next(Boom.badData(e.message))
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
