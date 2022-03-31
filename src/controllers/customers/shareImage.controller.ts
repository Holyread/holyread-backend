import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import shareImageService from '../../services/customers/shareImage/shareImage.service'
import { responseMessage } from '../../constants/message.constant'

const shareImageControllerResponse = responseMessage.shareImageControllerResponse

/** Get all share images by filter */
const getAllShareImages = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const data = await shareImageService.getAllShareImage()
        response.status(200).json({ message: shareImageControllerResponse.fetchShareImageSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllShareImages }
