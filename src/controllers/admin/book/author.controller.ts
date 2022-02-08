import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import authorService from '../../../services/book/author.service'
import bookSummaryService from '../../../services/book/bookSummary.service'
import { responseMessage } from '../../../constants/message.constant'
import { getSearchRegexp } from '../../../lib/utils/utils'
import { dataTable } from '../../../constants/app.constant'

const authorControllerResponse = responseMessage.authorControllerResponse

/** Add Author  */
const addAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const existingAuthor = await authorService.getOneAuthorByFilter({ name: body.name })
        if (existingAuthor) {
            return next(Boom.notFound(authorControllerResponse.createAuthorFailure))
        }
        const data = await authorService.createAuthor(body)
        res.status(200).send({
            message: authorControllerResponse.createAuthorSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one author by id */
const getOneAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get author from db */
        const authorObj: any = await authorService.getOneAuthorByFilter({ _id: id })
        if (!authorObj) {
            return next(Boom.notFound(authorControllerResponse.getAuthorFailure))
        }
        res.status(200).send({
            message: authorControllerResponse.fetchAuthorSuccess,
            data: authorObj
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all author */
const getAllAuthors = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        if (params.names === 'true') {
            const getAuthorsNames = await authorService.getAllAuthorsNames()
            response.status(200).json({ message: authorControllerResponse.fetchAuthorsSuccess, data: getAuthorsNames })
            return
        }
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { name: await getSearchRegexp(params.search) },
                    { about: await getSearchRegexp(params.search) },
                ]
            }
        }
        const authorListSorting = [];
        switch (params.column) {
            case 'title':
                authorListSorting.push(['name', params.order || 'ASC']);
                break;
            case 'createdAt':
                authorListSorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                authorListSorting.push(['name', 'DESC']);
                break;
        }

        const getAuthorsList = await authorService.getAllAuthors(Number(skip), Number(limit), searchFilter, authorListSorting)
        response.status(200).json({ message: authorControllerResponse.fetchAuthorsSuccess, data: getAuthorsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update author */
const updateAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get subscription from db */
        const authorObj: any = await authorService.getOneAuthorByFilter({ _id: id })
        if (!authorObj) {
            return next(Boom.notFound(authorControllerResponse.getAuthorFailure))
        }
        const data = await authorService.updateAuthor(req.body, id)
        res.status(200).send({ message: authorControllerResponse.updateAuthorSuccess, data })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove author */
const deleteAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const bookSummaryDetails = await bookSummaryService.getOneBookSummaryByFilter({ author: id })
        if (bookSummaryDetails) {
            return next(Boom.locked(authorControllerResponse.authorHaveBooksError))
        }
        await authorService.deleteAuthor(id)

        res.status(200).send({ message: authorControllerResponse.deleteAuthorSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addAuthor, getOneAuthor, getAllAuthors, updateAuthor, deleteAuthor }
