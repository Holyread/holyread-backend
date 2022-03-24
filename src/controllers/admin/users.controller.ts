import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/admin/users/user.service'
import subscriptionService from '../../services/admin/subscriptions/subscriptions.service'
import emailTemplateService from '../../services/admin/emailTemplate/emailTemplate.service'
import { responseMessage } from '../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3, getSearchRegexp, sentEmail, compileHtml } from '../../lib/utils/utils'
import { awsBucket, dataTable, emailTemplatesTitles } from '../../constants/app.constant'
import config from '../../../config'

const authControllerResponse = responseMessage.authControllerResponse
const adminControllerResponse = responseMessage.adminControllerResponse
const subscriptionsControllerResponse = responseMessage.subscriptionsControllerResponse

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
            body.image = await uploadImageToAwsS3(body.image, body.firstName, s3Bucket)
        }
        const password = (Math.random() + 1).toString(36).substring(2)
        const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.admin.customerRegistration })
        const subject = emailTemplateDetails.subject || 'Customer Registration'
        let html = `Your temporary password is: ${password}`

        if (emailTemplateDetails && emailTemplateDetails.content) {
            const contentData = { email: body.email, password, username: body.firstName + ' ' + body.lastName  }
            const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
            if (htmlData) {
                html = htmlData
            }
        }
        const result = await sentEmail(body.email, subject, html);
        if (!result) {
            return next(Boom.badData(adminControllerResponse.sentEmailFailure))
        }
        if (body.subscriptions) {
            const subscriptionDetails = await subscriptionService.getOneSubscriptionByFilter({ _id: body.subscriptions })
            if (!subscriptionDetails) {
                return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
            }
        }
        const data = await usersService.createUser({
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            password,
            image: body.image,
            type: 'User',
            status: 'Active',
            verified: true,
            subscriptions: body.subscriptions
        })
        res.status(200).send({
            message: adminControllerResponse.addUserSuccess,
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
        if (userObj.image) {
            userObj.image = awsBucket[NODE_ENV].s3BaseURL + '/users/' + userObj.image
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
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'firstName': await getSearchRegexp(params.search) },
                    { 'lastName': await getSearchRegexp(params.search) },
                    { 'email': await getSearchRegexp(params.search) },
                    { 'status': await getSearchRegexp(params.search) }
                ]
            }
        }

        const usersSorting = [];
        switch (params.column) {
            case 'firstName':
                usersSorting.push(['firstName', params.order || 'ASC']);
                break;
            case 'lastName':
                usersSorting.push(['lastName', params.order || 'ASC']);
                break;
            case 'email':
                usersSorting.push(['email', params.order || 'ASC']);
                break;
            case 'createdAt':
                usersSorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                usersSorting.push(['firstName', 'DESC']);
                break;
        }

        const getUsersList = await usersService.getAllUsers(Number(skip), Number(limit), searchFilter, usersSorting)
        response.status(200).json({ message: authControllerResponse.getUsersSuccess, data: getUsersList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update user */
const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.userId
        delete req.body.password
        delete req.body.library
        /** Get user from db */
        const userObj: any = await usersService.getOneUserByFilter({ _id: id })
        if (!userObj) {
            return next(Boom.notFound(authControllerResponse.getUserError))
        }
        if (req.body.image === null) {
            await removeImageToAwsS3(userObj.image, s3Bucket)
        }
        if (req.body.image && req.body.image.includes('base64')) {
            await removeImageToAwsS3(userObj.image, s3Bucket)
            req.body.image = await uploadImageToAwsS3(req.body.image, userObj.firstName, s3Bucket)
        }
        if (req.body.image && req.body.image.startsWith('http')) {
            req.body.image = userObj.image
        }
        if (req.body.subscriptions) {
            const subscriptionDetails = await subscriptionService.getOneSubscriptionByFilter({ _id: req.body.subscriptions })
            if (!subscriptionDetails) {
                return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
            }
        }
        req.body.email = userObj.email
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
