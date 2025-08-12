import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import appVersionService from '../../services/customers/appVersion/appVersion.service'

const checkUserAppVersion = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { platform, version } = request.body;
    
    const allowedPlatforms = ["android", "ios"];
    if (!platform || !allowedPlatforms.includes(platform.toLowerCase())) {
      return next(
        Boom.badRequest("Invalid platform. Only android and ios are supported.")
      );
    }
    const data = await appVersionService.getOneAppVersionByFilter({
      platform: request.body.platform,
    });

    let shouldUpdateAppVersion: boolean = true;

    if (data.version === version) {
      shouldUpdateAppVersion = false;
    }

    response
      .status(200)
      .json({ shouldUpdateAppVersion, version: data.version });
  } catch (e: any) {
    next(Boom.badData(e.message));
  }
};
export { checkUserAppVersion }
