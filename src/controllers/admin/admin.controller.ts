import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import userService from '../../services/users/user.service'
import { responseMessage } from '../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3 } from '../../lib/utils/utils'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'

const adminControllerResponse = responseMessage.adminControllerResponse
const authControllerResponse = responseMessage.authControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.usersDirectory}`,
}

/**  Get one admin by id */
const getOneAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get user from db */
        const userObj: any = await userService.getOneUserByFilter({ _id: id })
        if (!userObj) {
            next(Boom.notFound(adminControllerResponse.getAdminFailure))    
        }
        res.status(200).send({ message: adminControllerResponse.fetchAdminSuccess, data: userObj })
    } catch (e) {
        next(Boom.badData(e.message))
    }
}


/**  Get one user by id */
const getOneUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.userId
        /** Get user from db */
        const userObj: any = await userService.getOneUserByFilter({ _id: id })
        if (!userObj) {
            next(Boom.notFound(authControllerResponse.getUserError))    
        }
        res.status(200).send({ message: authControllerResponse.getUserSuccess, data: userObj })
    } catch (e) {
        next(Boom.badData(e.message))
    }
}

/** Update user */
const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.userId
        /** Get user from db */
        const userObj: any = await userService.getOneUserByFilter({ _id: id })
        if (!userObj) {
            throw new Error(authControllerResponse.getUserError)
        }
        if (req.body.image === null) {
            await removeImageToAwsS3(userObj.image, s3Bucket)
        }
        if (req.body.image) {
            await removeImageToAwsS3(userObj.image, s3Bucket)
            req.body.image = await uploadImageToAwsS3(req.body.image, userObj.name, s3Bucket)
        }
        await userService.updateUser(req.body, req.params.userId)
        return res.status(200).send({ message: authControllerResponse.userUpdateSuccess })
    } catch (e) {
        return next(Boom.badData(e.message))
    }
}

/** Remove User */
const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.userId
        const userObj: any = await userService.getOneUserByFilter({ _id: id })
        if (userObj && userObj.image) {
            await removeImageToAwsS3(userObj.image, s3Bucket)
        }
        await userService.deleteUser(id)
        return res.status(200).send({ message: authControllerResponse.deleteUserSuccess })
    } catch (e) {
        return next(Boom.badData(e.message))
    }
}

export { getOneAdmin, getOneUser, updateUser, deleteUser }
