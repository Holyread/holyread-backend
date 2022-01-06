import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/users/user.service'
import { responseMessage } from '../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3, encrypt } from '../../lib/utils/utils'
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
const getAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get admin from db */
        const data: any = await usersService.getOneUserByFilter({ _id: id, type: 'Admin' })
        if (!data) {
            return next(Boom.notFound(adminControllerResponse.getAdminFailure))
        }
        delete data.verificationCode
        res.status(200).send({ message: adminControllerResponse.fetchAdminSuccess, data: data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update admin details */
const updateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get user from db */
        const data: any = await usersService.getOneUserByFilter({ _id: id, type: 'Admin' })
        if (!data) {
            return next(Boom.notFound(adminControllerResponse.getAdminFailure))
        }
        if (req.body.image === null) {
            await removeImageToAwsS3(data.image, s3Bucket)
        }
        if (req.body.image) {
            await removeImageToAwsS3(data.image, s3Bucket)
            req.body.image = await uploadImageToAwsS3(req.body.image, data.name, s3Bucket)
        }
        await usersService.updateUser(req.body, id)
        return res.status(200).send({ message: adminControllerResponse.updateAdminSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/**  change password */
const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { password, newPassword }: { password: string, newPassword: string } = req.body
        const id = req.params.id as string
        /** Get user from db */
        const userObj: any = await usersService.getOneUserByFilter({ _id: id, password: encrypt(password), type: 'Admin' })
        if (!userObj) {
            return next(Boom.notFound(authControllerResponse.userInvalidPasswordError))
        }
        await usersService.updateUser({ password: newPassword }, userObj._id)
        res.status(200).send({ message: adminControllerResponse.forgotPassowrdSuccess })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAdmin, updateAdmin, changePassword }
