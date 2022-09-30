import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/admin/users/user.service'
import bookSummaryService from '../../services/admin/book/bookSummary.service'
import { responseMessage } from '../../constants/message.constant'
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

export { getDashboard }
