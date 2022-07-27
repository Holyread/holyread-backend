import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/admin/users/user.service'
import { responseMessage } from '../../constants/message.constant'
import { removeS3File, uploadFileToS3, encrypt } from '../../lib/utils/utils'
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
const getAdmin = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        const data: any = Object.assign({}, req.user)
        if (data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/users/' + data.image
        }
        delete data.verificationCode
        delete data.password
        delete data.library
        delete data.smallGroups
        res.status(200).send({ message: adminControllerResponse.fetchAdminSuccess, data: data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update admin details */
const updateAdmin = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        const data: any = req.user
        req.body.email = data.email
        if (req.body.image === null) {
            await removeS3File(data.image, s3Bucket)
        }
        if (req.body.image && req.body.image.includes('base64')) {
            await removeS3File(data.image, s3Bucket)
            req.body.image = await uploadFileToS3(req.body.image, data.firstName || data.email.substring(0, data.email.lastIndexOf("@")), s3Bucket)
        }
        if (req.body.image && req.body.image.startsWith('http')) {
            req.body.image = data.image
        }
        await usersService.updateUser(req.body, data._id)
        return res.status(200).send({ message: adminControllerResponse.updateAdminSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/**  change password */
const changePassword = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        const { password, newPassword }: { password: string, newPassword: string } = req.body
        if (req.user?.password !== encrypt(password)) {
            return next(Boom.notFound(authControllerResponse.userInvalidPasswordError))
        }
        await usersService.updateUser({ password: newPassword }, req.user._id)
        res.status(200).send({ message: adminControllerResponse.forgotPassowrdSuccess })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAdmin, updateAdmin, changePassword }
