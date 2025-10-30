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
        const language = (request as any).languageId;

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const trnSorting = ['status', 'email', 'total', 'date'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['date', 'desc']];

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
            trnSorting,
            language
        )
        response.status(200).json({ message: transactionsControllerResponse.getTransactionsSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one testimonial by id */
const getOneTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get testimonial from db */
        const data: any = await transactionsService.getTransactionById(id)
        if (!data) {
            return next(Boom.notFound(transactionsControllerResponse.getTransactionFailure))
        }
        res.status(200).send({ message: transactionsControllerResponse.fetchTransactionSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllTransactions, getOneTransaction }
