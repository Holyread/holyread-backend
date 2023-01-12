import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import settingService from '../../services/customers/setting/setting.service'
import { responseMessage } from '../../constants/message.constant'

const settingControllerResponse = responseMessage.settingControllerResponse

/**  Get setting */
const getSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        /** Get setting from db */
        const data: any = await settingService.getSetting()
        if (!data) {
            return next(Boom.notFound(settingControllerResponse.getSettingFailure))
        }
        res.status(200).send({
            message: settingControllerResponse.fetchSettingSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getSetting }
