import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import expertCuratedService from '../../../services/customers/book/expertCurated.service'
import { responseMessage } from '../../../constants/message.constant'
import { getSearchRegexp } from '../../../lib/utils/utils'
import { awsBucket, dataTable } from '../../../constants/app.constant'
import config from '../../../../config'

const expertCuratedControllerResponse = responseMessage.expertCuratedControllerResponse

const NODE_ENV = config.NODE_ENV

/**  Get one expert Curated by id */
const getOneExpertCurated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get expert Curated from db */
        const data: any = await expertCuratedService
            .getOneExpertCuratedByFilter(
                { _id: id }
            )
        if (!data) {
            return next(
                Boom.notFound(
                    expertCuratedControllerResponse.getExpertCuratedFailure
                )
            )
        }
        if (data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCurated/' + data.image
        }

        res.status(200).send({
            message: expertCuratedControllerResponse.fetchExpertCuratedSuccess,
            data
        })
        
        /** Incress curated views */
        expertCuratedService
            .updateOneExpertCurated(
                { _id: id },
                { '$inc': { views: 1 } }
            )
        
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all book summary by filter */
const getAllExpertCurated = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query as any
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'title': await getSearchRegexp(params.search) },
                    { 'status': await getSearchRegexp(params.search) },
                    { 'description': await getSearchRegexp(params.search) }
                ]
            }
        }
        params.order = String(params.order || 'asc').toLowerCase() === 'asc' ? 1.0 : -1.0
        const expertCuratedSorting: any = {};
        switch (params.column) {
            case 'title':
                expertCuratedSorting.title = params.order;
                break;
            case 'status':
                expertCuratedSorting.status = params.order;
                break;
            case 'createdAt':
                expertCuratedSorting.createdAt = params.order;
                break;
            default:
                expertCuratedSorting.title = -1.0;
                break;
        }

        const data = await expertCuratedService.getAllExpertCurateds(Number(skip), Number(limit), searchFilter, expertCuratedSorting)
        response.status(200).json({ message: expertCuratedControllerResponse.fetchAllExpertCuratedSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export {
    getOneExpertCurated,
    getAllExpertCurated
}
