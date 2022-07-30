import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import highLightsService from '../../services/customers/highLights/highLights.service'
import bookSummaryService from '../../services/admin/book/bookSummary.service'
import { responseMessage } from '../../constants/message.constant'

const highLightsControllerResponse = responseMessage.highLightsControllerResponse
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

/** Add high light */
const addHighLight = async (req: any, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const bookDetails = await bookSummaryService.getOneBookSummaryByFilter({
            _id: body.bookId, 'chapters._id': body.chapterId
        })
        if (!bookDetails) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
        }
        const data = await highLightsService.createHighLight({ ...body, userId: req.user._id })
        res.status(200).send({
            message: highLightsControllerResponse.createHighLightSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get high lights by filter */
const getHighLightsByFilter = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        let params = req.query
        let filter: any = { userId: req.user._id }
        const skip: any = params.skip ? params.skip : 0
        const limit: any = params.limit ? params.limit : 0
        if (params.bookId) {
            filter.bookId = params.bookId
        }
        if (params.bookId && params.chapterId) {
            filter = {
                userId: req.user._id,
                bookId: params.bookId,
                chapterId: params.chapterId
            }
            const data: any = await highLightsService.getHighLightByFilter(Number(skip), Number(limit), filter, [['createdAt', 'DESC']])
            res.status(200).send({ message: highLightsControllerResponse.fetchHighLightsSuccess, data: data.highLightsBooks[0] })
            return;
        }
        if (params.search) {
            filter.search = params.search
        }
        /** Get high lights from db */
        const data: any = await highLightsService.getHighLightsByFilter(Number(skip) || 0, Number(params.limit) || 0, filter, [['createdAt', 'DESC']])
        res.status(200).send({ message: highLightsControllerResponse.fetchHighLightsSuccess, data: params.bookId && data.highLightsBooks.length ? data.highLightsBooks[0] : data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update high light */
const updateHighLight = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { highLightId } = req.params
        await highLightsService.updateHighLight({ ...req.body, userId: req.user._id }, highLightId)
        return res.status(200).send({ message: highLightsControllerResponse.updateHighLightSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove high light */
const deleteHighLight = async (req: any, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const highLightId = req.params.highLightId
        await highLightsService.deleteHighLight(req.user._id, id, highLightId)
        return res.status(200).send({ message: highLightsControllerResponse.deleteHighLightSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addHighLight, getHighLightsByFilter, updateHighLight, deleteHighLight }
