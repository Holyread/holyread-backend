import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/admin/users/user.service'
import { responseMessage } from '../../constants/message.constant'
import bookSummaryService from '../../services/admin/book/bookSummary.service'
import transactionsService from '../../services/admin/users/transactions.service'

// import { groupByKey } from '../../lib/utils/utils';

const dashboardControllerResponse = responseMessage.dashboardControllerResponse

/** Get Dashboard */
const getDashboard = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const language = (request as any).languageId;
        const usersAggregation = await usersService.getAllUsersForDashboard({
            device: { $in: ['android', 'ios', 'web'] },
        }, language);

        const usersByGroup = usersAggregation.reduce((acc, { _id, count }) => {
            acc[_id] = count;
            return acc;
        }, { android: 0, ios: 0, web: 0 });

        const totalUsers = usersByGroup.android + usersByGroup.ios + usersByGroup.web;

        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: {
                users: {
                    count: totalUsers,
                    androidCount: usersByGroup.android,
                    iosCount: usersByGroup.ios,
                    webCount: usersByGroup.web,
                }
            },
        });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

const getBooksCountForDashboard = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const language = (request as any).languageId;
        const bookSummary = await bookSummaryService.getBooksCountForDashboard(language);
        
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: {
                audio: { count: bookSummary.chaptersCount },
                video: { count: bookSummary.booksCount },
                book: { count: bookSummary.booksCount },
            },
        });
    } catch (e: any) {
        next(Boom.badData(e.message || 'Failed to fetch book summaries for dashboard'));
    }
};

const getTopReadsBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const language = (request as any).languageId;
        const bookSummary: any = await bookSummaryService.getTopReadsBooks(request.query.duration as 'year' | 'month' | 'week', language)
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: bookSummary,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

const getUserAnaylatics = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const language = (request as any).languageId;
        const data
            = await transactionsService
                .getUserAnalytics(
                    request.query.duration as string || 'year',
                    language
                );
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export {
    getDashboard,
    getTopReadsBooks,
    getUserAnaylatics,
    getBooksCountForDashboard
}
