import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/admin/users/user.service'
import { responseMessage } from '../../constants/message.constant'
import bookSummaryService from '../../services/admin/book/bookSummary.service'
import transactionsService from '../../services/admin/users/transactions.service'

import { groupByKey } from '../../lib/utils/utils';

const dashboardControllerResponse = responseMessage.dashboardControllerResponse

/** Get Dashboard */
const getDashboard = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const users = await usersService.getAllUsersForDashboard({
            device: { $in: ['android', 'ios', 'web']} 
        }, 'device');
        const usersByGroup = groupByKey(users, 'device')
        const bookSummary: any = await bookSummaryService.getBooksCountForDashboard()
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: {
                users: {
                    count: users.length,
                    androidCount: usersByGroup['android'].length,
                    iosCount: usersByGroup['ios'].length,
                    webCount: usersByGroup['web'].length
                },
                audio: { count: bookSummary.summaries[0].chapters },
                video: { count: bookSummary.count },
                book: { count: bookSummary.count }
            }
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

const getTopReadsBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const bookSummary: any = await bookSummaryService.getTopReadsBooks(request.query.duration as 'year' | 'month' | 'week')
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: bookSummary
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

const getUserAnaylatics = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const data
            = await transactionsService
                .getUserAnalytics(
                    request.query.duration as string || 'year'
                );
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export {
    getDashboard,
    getTopReadsBooks,
    getUserAnaylatics,
}
