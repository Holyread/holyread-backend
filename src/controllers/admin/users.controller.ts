import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/admin/users/user.service'
import subscriptionService from '../../services/admin/subscriptions/subscriptions.service'
import stripeSubscriptionService from '../../services/stripe/subscription'
import emailTemplateService from '../../services/admin/emailTemplate/emailTemplate.service'
import { responseMessage } from '../../constants/message.constant'
import { removeS3File, uploadFileToS3, getSearchRegexp, sentEmail, compileHtml } from '../../lib/utils/utils'
import { awsBucket, dataTable, emailTemplatesTitles } from '../../constants/app.constant'
import config from '../../../config'
import notificationsService from '../../services/customers/notifications/notifications.service';
import { io } from '../../app';
import { fetchNotifications } from '../customers/notification.controller';
import ratingService from '../../services/customers/book/rating.service';
import highLightsService from '../../services/customers/highLights/highLights.service';

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
        const user: any = await usersService.getOneUserByFilter({ email: body.email })
        if (user) {
            return next(Boom.badData(authControllerResponse.userAlreadyExistError))
        }
        if (body.image) {
            const s3File: any = await uploadFileToS3(body.image, body.email.substring(0, body.email.lastIndexOf("@")), s3Bucket)
            body.image = s3File.name
        }
        const password = (Math.random() + 1).toString(36).substring(2)
        const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.admin.customerRegistration })
        const subject = emailTemplateDetails.subject || 'Account Verification'
        let html = `<p>Your temporary password is: <b>${password}</b></p>`

        if (emailTemplateDetails && emailTemplateDetails.content) {
            const contentData = { email: body.email, password, username: body.firstName + ' ' + body.lastName }
            const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
            if (htmlData) {
                html = htmlData
            }
        }
        const result = await sentEmail(body.email, subject, html);
        if (!result) {
            return next(Boom.badData(adminControllerResponse.sentEmailFailure))
        }
        const newBody: any = {
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            password,
            image: body.image,
            type: 'User',
            status: 'Active',
            verified: true,
            device: 'web'
        }
        const subscriptionDetails = await subscriptionService.getOneSubscriptionByFilter({ _id: body.subscriptions })
        if (body.subscriptions) {
            if (!subscriptionDetails || !subscriptionDetails.stripePlanId) {
                return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
            }
            const customer = await stripeSubscriptionService.createCustomer(body.email as any)
            const subscription = await stripeSubscriptionService.createSubscription(subscriptionDetails.stripePlanId, customer.id)
            newBody['stripe.planId'] = subscriptionDetails.stripePlanId
            newBody['stripe.subscriptionId'] = subscription.id
            newBody['stripe.customerId'] = customer.id
            newBody.subscriptions = subscriptionDetails._id
        }

        const data = await usersService.createUser(newBody)
        if (body.subscriptions) {
            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.chooseSubscription })
        const sub = emailTemplateDetails.subject || 'Subscription'
        let html = `<p>Dear ${body.email.split('@')[0]},</p><p>You have subscribed to ${subscriptionDetails.title} Plan for 30 days on ${subscriptionDetails.duration} basis.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

        if (emailTemplateDetails && emailTemplateDetails.content) {
            const contentData = {
                username: body.email.split('@')[0],
                subscription_title: subscriptionDetails.title,
                subscription_details: subscriptionDetails.duration,
                subscription_duration: subscriptionDetails.title
            }
            const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
            if (htmlData) {
                html = htmlData
            }
        }
            const result = await sentEmail(data.email, sub, html);
            if (!result) {
                return next(Boom.notFound(authControllerResponse.sentSubscriptionEmailFilure))
            }
        }
        res.status(200).send({
            message: adminControllerResponse.addUserSuccess,
            data: {
                _id: data._id,
                email: data.email
            }
        })
        const title = 'Welcome to Holyreads';
        const description = 'Enjoy best summaries audio and video';
        await notificationsService.createNotification({ userId: data._id, type: 'user', notification: { title, description } })
        const createSubscriptionTitle = 'Subscription Created'
        const createSubscriptionDesc = 'Subscription created successfully'
        await notificationsService.createNotification({ userId: data._id, type: 'setting', notification: { title: createSubscriptionTitle, description: createSubscriptionDesc } })
        fetchNotifications(io.sockets, { _id: data._id })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one user by id */
const getOneUser = async (req: Request | any, res: Response, next: NextFunction) => {
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
const getAllUsers = async (request: Request | any, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'email': await getSearchRegexp(params.search) },
                    { 'firstName': await getSearchRegexp(params.search) },
                    { 'lastName': await getSearchRegexp(params.search) },
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
const updateUser = async (req: Request | any, res: Response, next: NextFunction) => {
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
            await removeS3File(userObj.image, s3Bucket)
        }
        if (req.body.image && req.body.image.includes('base64')) {
            await removeS3File(userObj.image, s3Bucket)
            const s3File: any = await uploadFileToS3(req.body.image, 'Profile', s3Bucket)
            req.body.image = s3File.name
        }
        if (req.body.image && req.body.image.startsWith('http')) {
            req.body.image = userObj.image
        }
        if (req.body.subscriptions && String(req.body.subscriptions) !== String(userObj.subscriptions)) {
            const subscriptionDetails = await subscriptionService.getOneSubscriptionByFilter({ _id: req.body.subscriptions })
            if (!subscriptionDetails) {
                return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
            }
            if (!subscriptionDetails || !subscriptionDetails.stripePlanId) {
                return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
            }
            const customer = userObj.stripe.customerId || await stripeSubscriptionService.createCustomer(req.body.email as any)
            const subscription = await stripeSubscriptionService.createSubscription(subscriptionDetails.stripePlanId, customer.id)
            req.body['stripe.planId'] = subscriptionDetails.stripePlanId
            req.body['stripe.subscriptionId'] = subscription.id
            req.body['stripe.customerId'] = customer.id
            req.body.subscriptions = subscriptionDetails._id
        }
        req.body.email = userObj.email
        req.body.device = userObj.device || ''
        await usersService.updateUser(req.body, { _id: req.params.userId })
        return res.status(200).send({ message: authControllerResponse.userUpdateSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove User */
const deleteUser = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.userId
        const userObj: any = await usersService.getOneUserByFilter({ _id: id })
        await usersService.deleteUser(id)
        res.status(200).send({ message: authControllerResponse.deleteUserSuccess })
        if (userObj && userObj.image) {
            await removeS3File(userObj.image, s3Bucket)
        }
        if (userObj?.stripe?.subscriptionId) {
            await stripeSubscriptionService.cancelSubscription(userObj.stripe.subscriptionId)
        }
        /** Delete user notifications */
        const deleteNotifications = notificationsService.deleteNotifications({ userId: userObj._id })
        /** Delete user books ratings */
        const deleteRatings = ratingService.deleteRatings({ userId: userObj._id })
        const deleteHighlights = highLightsService.deleteHighLights({ userId: userObj._id })
        await Promise.all([deleteNotifications, deleteRatings, deleteHighlights])
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addUser, getOneUser, getAllUsers, updateUser, deleteUser }
