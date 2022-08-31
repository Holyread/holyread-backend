import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import authorService from '../../../services/customers/book/author.service'
import { responseMessage } from '../../../constants/message.constant'

const authorControllerResponse = responseMessage.authorControllerResponse

/** Get all author options list */
const getAllAuthorsOptionsList = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const getAuthorsOptionsList = await authorService.getAllAuthorsOptionsList()
        response.status(200).json({ message: authorControllerResponse.fetchAuthorsSuccess, data: getAuthorsOptionsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllAuthorsOptionsList }
