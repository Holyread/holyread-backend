import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/users/user.service'
import { responseMessage } from '../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3, getSearchRegexp } from '../../lib/utils/utils'
import { awsBucket, dataTable } from '../../constants/app.constant'
import config from '../../../config'

const authControllerResponse = responseMessage.authControllerResponse
const adminControllerResponse = responseMessage.adminControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.usersDirectory}`,
}

/** Add User */
const addUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        /** Get user from db */
        const user: any = await usersService.getOneUserByFilter({ email: req.body.email })
        if (user) {
            return next(Boom.badData(authControllerResponse.userAlreadyExistError))
        }
        if (body.image) {
            body.image = await uploadImageToAwsS3(body.image, body.name, s3Bucket)
        }
        const data = await usersService.createUser({
            name: body.name,
            email: body.email,
            password: body.password,
            image: body.image,
            type: 'User',
            status: 'Active',
            verified: true
        })
        res.status(200).send({
            message: adminControllerResponse.createAdminSuccess,
            data: {
                _id: data._id,
                email: data.email
            }
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one user by id */
const getOneUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.userId
        /** Get user from db */
        const userObj: any = await usersService.getOneUserByFilter({ _id: id })
        if (!userObj) {
            return next(Boom.notFound(authControllerResponse.getUserError))
        }
        res.status(200).send({ message: authControllerResponse.getUserSuccess, data: userObj })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all Users */
const getAllUsers = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) { searchFilter = { 'name': await getSearchRegexp(params.search) } }

        const usersSorting = [];
        switch (params.column) {
            case 'name':
                usersSorting.push(['name', params.order || 'ASC']);
                break;
            case 'email':
                usersSorting.push(['email', params.order || 'ASC']);
                break;
            case 'createdAt':
                usersSorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                usersSorting.push(['name', 'DESC']);
                break;
        }

        const getUsersList = await usersService.getAllUsers(Number(skip), Number(limit), searchFilter, usersSorting)
        response.status(200).json({ message: authControllerResponse.getUserSuccess, data: getUsersList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update user */
const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.userId
        /** Get user from db */
        const userObj: any = await usersService.getOneUserByFilter({ _id: id })
        if (!userObj) {
            return next(Boom.notFound(authControllerResponse.getUserError))
        }
        if (req.body.image === null) {
            await removeImageToAwsS3(userObj.image, s3Bucket)
        }
        if (req.body.image) {
            await removeImageToAwsS3(userObj.image, s3Bucket)
            req.body.image = await uploadImageToAwsS3(req.body.image, userObj.name, s3Bucket)
        }
        await usersService.updateUser(req.body, req.params.userId)
        return res.status(200).send({ message: authControllerResponse.userUpdateSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove User */
const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.userId
        const userObj: any = await usersService.getOneUserByFilter({ _id: id })
        if (userObj && userObj.image) {
            await removeImageToAwsS3(userObj.image, s3Bucket)
        }
        await usersService.deleteUser(id)
        return res.status(200).send({ message: authControllerResponse.deleteUserSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addUser, getOneUser, getAllUsers, updateUser, deleteUser }
