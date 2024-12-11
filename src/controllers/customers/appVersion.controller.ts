import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import appVersionService from '../../services/customers/appVersion/appVersion.service'

const checkUserAppVersion = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const data = await appVersionService.getOneAppVersionByFilter({ platform: request.body.platform });

        let shouldUpdateAppVersion: boolean = true;

        if (data.version === request.body.version) {
            shouldUpdateAppVersion = false;
        }

        response.status(200).json({ shouldUpdateAppVersion , version: data.version });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};
export { checkUserAppVersion }
