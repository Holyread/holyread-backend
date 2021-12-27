import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/users/user.service'
import { responseMessage } from '../../constants/message.constant'

const dashboardControllerResponse = responseMessage.dashboardControllerResponse

/** Get Dashboard */
const getDashboard = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const getUsersList = await usersService.getAllUsers(0, 0, {}, [])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: { users: { count: getUsersList.count } }
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getDashboard }
