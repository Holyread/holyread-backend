import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import transactionsService from '../../services/admin/users/transactions.service'
import { responseMessage } from '../../constants/message.constant'
import { dataTable } from '../../constants/app.constant'

const transactionsControllerResponse = responseMessage.transactionsControllerResponse

/** Get all Transactions */
const getAllTransactions = async (request: Request | any, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : 10

        const trnSorting = [];
        switch (params.column) {
            case 'status':
                trnSorting.push(['status', params.order || 'asc']);
                break;
            case 'email':
                trnSorting.push(['email', params.order || 'asc']);
                break;
            case 'total':
                trnSorting.push(['total', params.order || 'asc']);
                break;
            case 'date':
                trnSorting.push(['date', params.order || 'asc']);
                break;
            default:
                trnSorting.push(['date', 'desc']);
                break;
        }
        if (params.from) {
            params.from = new Date(params.from).setHours(0, 0, 0, 0)
        }
        if (params.to) {
            params.to = new Date(params.to).setHours(23, 59, 59, 999)
        }
        const data = await transactionsService.getAllTransactions(
            Number(skip),
            Number(limit),
            {
                keyword: params?.search?.trim()?.toLowerCase(),
                from: params.from,
                to: params.to,
            },
            trnSorting
        )
        response.status(200).json({ message: transactionsControllerResponse.getTransactionsSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllTransactions }
