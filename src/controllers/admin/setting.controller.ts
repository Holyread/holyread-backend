import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import settingService from '../../services/admin/setting/setting.service'
import { responseMessage } from '../../constants/message.constant'

const settingControllerResponse = responseMessage.settingControllerResponse

/**  Get setting */
const getSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        /** Get setting from db */
        const cmsObj: any = await settingService.getSetting()
        if (!cmsObj) {
            return next(Boom.notFound(settingControllerResponse.getSettingFailure))
        }
        res.status(200).send({
            message: settingControllerResponse.fetchSettingSuccess,
            data: cmsObj,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update setting */
const updateSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        /** Get setting from db */
        const data = await settingService.updateSetting(req.body)
        return res.status(200).send({ message: settingControllerResponse.updateSettingSuccess, data })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { getSetting, updateSetting }
