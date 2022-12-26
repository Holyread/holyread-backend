import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/admin/users/user.service'
import subscriptionService from '../../services/admin/subscriptions/subscriptions.service'
import stripeSubscriptionService from '../../services/stripe/subscription'
import emailTemplateService from '../../services/admin/emailTemplate/emailTemplate.service'
import { responseMessage } from '../../constants/message.constant'
import { removeS3File, uploadFileToS3, getSearchRegexp, sentEmail, compileHtml, getToken } from '../../lib/utils/utils'
import { awsBucket, dataTable, emailTemplatesTitles, origins } from '../../constants/app.constant'
import config from '../../../config'
import notificationsService from '../../services/customers/notifications/notifications.service';
import { io } from '../../app';
import { fetchNotifications } from '../customers/notification.controller';
import ratingService from '../../services/customers/book/rating.service';
import highLightsService from '../../services/customers/highLights/highLights.service';
import transactionsService from '../../services/admin/users/transactions.service';

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
        const verificationCode = Math.floor(1000 + Math.random() * 9000)
        const token: string = getToken({ code: String(verificationCode), email: body.email })
        const link: string = `${origins[NODE_ENV]}/account/verify-user?token=${token}`
        const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.admin.customerRegistration })
        const subject = emailTemplateDetails.subject || 'Account Verification'
        let html = `<p>Dear ${body.email.split('@')[0]}, You have registerd on holy reads by admin <b><p>Your account details are as below:</p><p>email: ${body.email}</p><p>password: ${password}</p></b><b>Please click <a href=${link}>here</a> to verify your email and activate your account.</b></p>`

        if (emailTemplateDetails && emailTemplateDetails.content) {
            const contentData = { email: body.email, password, username: body.firstName + ' ' + body.lastName, link }
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
        const subscriptionDetails = body.subscription && await subscriptionService.getOneSubscriptionByFilter({ _id: body.subscription })
        if (body.subscription) {
            if (!subscriptionDetails || !subscriptionDetails.stripePlanId) {
                return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
            }
            const customer = await stripeSubscriptionService.createCustomer(body.email as any)
            const subscription = await stripeSubscriptionService.createSubscription({
                planId: subscriptionDetails.stripePlanId, customerId: customer.id
            })
            newBody.stripe = {
                planId: subscriptionDetails.stripePlanId,
                subscriptionId: subscription.id,
                customerId: customer.id,
                createdAt: new Date()
            }
            newBody.subscription = subscriptionDetails._id
        }

        const data = await usersService.createUser(newBody)
        res.status(200).send({
            message: adminControllerResponse.addUserSuccess,
            data: {
                _id: data._id,
                email: data.email
            }
        })
        const title = 'Welcome to Holy Reads 🎉';
        const description = 'Summarizing the best of Christian publishing for your busy schedule';
        await notificationsService.createNotification({ userId: data._id, type: 'user', notification: { title, description } })
        const createSubscriptionTitle = 'Holy Reads Subscription'
        const createSubscriptionDesc = `Holy Reads ${subscriptionDetails.duration.includes('Half') ? subscriptionDetails.duration : '1 ' + subscriptionDetails.duration} Subscription activated successfully`
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
        if (req.body.subscription && String(req.body.subscription) !== String(userObj.subscription)) {
            const subscriptionDetails = await subscriptionService.getOneSubscriptionByFilter({ _id: req.body.subscription })
            if (!subscriptionDetails) {
                return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
            }
            if (!subscriptionDetails || !subscriptionDetails.stripePlanId) {
                return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
            }
            const customer = userObj.stripe.customerId || await stripeSubscriptionService.createCustomer(req.body.email as any)
            let subscription;
            if (!userObj?.stripe?.subscriptionId) {
                /** Create stripe subscription */
                subscription = await stripeSubscriptionService.createSubscription({
                    planId: subscriptionDetails.stripePlanId,
                    customerId: customer.id
                })
            } else {
                /** Update stripe subscription */
                await stripeSubscriptionService.updateSubscription({
                    planId: subscriptionDetails.stripePlanId,
                    subscriptionId: userObj.stripe.subscriptionId
                })
                subscription = await stripeSubscriptionService.retrieveSubscription(userObj.stripe.subscriptionId)
            }
            req.body['stripe.planId'] = subscriptionDetails.stripePlanId
            req.body['stripe.subscriptionId'] = subscription.id
            req.body['stripe.customerId'] = customer.id
            req.body.subscription = subscriptionDetails._id
        }
        req.body.email = userObj.email
        req.body.device = userObj.device || ''
        await usersService.updateUser({ _id: req.params.userId }, req.body)
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
            removeS3File(userObj.image, s3Bucket)
        }
        if (userObj?.stripe?.subscriptionId) {
            stripeSubscriptionService.cancelSubscription(userObj.stripe.subscriptionId)
        }

        Promise.all([
            ratingService.deleteRatings({ userId: userObj._id }),
            highLightsService.deleteHighLights({ userId: userObj._id }),
            transactionsService.deleteTransaction({ userId: userObj._id }),
            notificationsService.deleteNotifications({ userId: userObj._id })
        ])
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addUser, getOneUser, getAllUsers, updateUser, deleteUser }
