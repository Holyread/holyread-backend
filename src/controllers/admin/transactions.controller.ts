import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import transactionsService from '../../services/admin/users/transactions.service'
import { responseMessage } from '../../constants/message.constant'
import { getSearchRegexp } from '../../lib/utils/utils'
import { dataTable } from '../../constants/app.constant'

const transactionsControllerResponse = responseMessage.transactionsControllerResponse

/** Get all Transactions */
const getAllTransactions = async (request: Request | any, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : 10

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'status': await getSearchRegexp(params.search) },
                    { 'email': await getSearchRegexp(params.search) },
                ]
            }
        }

        const trnSorting = [];
        switch (params.column) {
            case 'status':
                trnSorting.push(['status', params.order || 'ASC']);
                break;
            case 'email':
                trnSorting.push(['email', params.order || 'ASC']);
                break;
            case 'total':
                trnSorting.push(['total', params.order || 'ASC']);
                break;
            case 'date':
                trnSorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                trnSorting.push(['createdAt', 'DESC']);
                break;
        }

        const data = await transactionsService.getAllTransactions(Number(skip), Number(limit), searchFilter, trnSorting)
        response.status(200).json({ message: transactionsControllerResponse.getTransactionsSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllTransactions }
