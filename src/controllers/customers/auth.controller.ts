import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import axios from 'axios';

import { encrypt, getToken, verifyToken, sentEmail, pushNotification } from '../../lib/utils/utils'
import usersService from '../../services/admin/users/user.service'
import emailTemplateService from '../../services/admin/emailTemplate/emailTemplate.service'
import { responseMessage } from '../../constants/message.constant'
import { origins, emailTemplatesTitles } from '../../constants/app.constant'
import { uploadFileToS3, compileHtml } from '../../lib/utils/utils'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'
import notificationsService from '../../services/customers/notifications/notifications.service';
import stripeSubscriptionService from '../../services/stripe/subscription';
import subscriptionsService from '../../services/admin/subscriptions/subscriptions.service';

const authControllerResponse = responseMessage.authControllerResponse
const adminControllerResponse = responseMessage.adminControllerResponse
const subscriptionsControllerResponse = responseMessage.subscriptionsControllerResponse
const NODE_ENV = config.NODE_ENV
const s3Bucket = {
  region: awsBucket.region,
  bucketName: awsBucket[NODE_ENV].bucketName,
  documentDirectory: `${awsBucket.usersDirectory}`,
}

/** user signIn */
const signInUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params: { email: string, password: string } = req.body
    const user = await usersService.getOneUserByFilter({ email: params.email, password: encrypt(params.password) })
    if (!user || user.type === 'Admin') {
      return next(Boom.unauthorized(authControllerResponse.userNotAuthorizationError))
    }
    if (user && user.status !== 'Active') {
      return next(Boom.notAcceptable(authControllerResponse.userNotActivatedError))
    }
    const token: string = getToken({ email: user.email, id: user._id, isNewLogin: String(!user.loginAt) })
    res.status(200).json({
      message: authControllerResponse.loginSuccess,
      data: { _id: user._id, email: user.email, token, type: user.type }
    })
    await usersService.updateUser({ loginAt: new Date() }, { _id: user._id });
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/** Add User */
const signUpUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    /** Get user from db */
    const user: any = await usersService.getOneUserByFilter({ email: body.email })
    if (user && !user.verified) return res.status(200).send({ message: authControllerResponse.verifyEmailSuccess })
    if (user && user.verified) return next(Boom.conflict(authControllerResponse.userAlreadyExistError))

    const subscriptionDetails = body.subscription && await subscriptionsService.getOneSubscriptionByFilter({ _id: body.subscription })
    if (
      body.subscription &&
      body.inAppSubscription &&
      (!subscriptionDetails || !subscriptionDetails.stripePlanId)
    ) return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))

    const verificationCode = Math.floor(1000 + Math.random() * 9000)
    const token: string = getToken({ code: String(verificationCode), email: body.email })
    const link: string = `${origins[NODE_ENV]}/account/verify-user?token=${token}`
    const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.registration })
    const subject = emailTemplateDetails?.subject || 'Account Verification'
    let html = `<p>Dear ${body.email.split('@')[0]},</p><p>Thank you for registering with Holy Reads.</p><p>Your customer account details are below:</p><p>Email : ${body.email}</p><p>Please click <a href="${link}">Here</a> to verify your registration.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`
    if (emailTemplateDetails && emailTemplateDetails.content) {
      const contentData = { link, code: verificationCode, username: body.email.split('@')[0] }
      const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
      if (htmlData) {
        html = htmlData
      }
    }

    /** sent email for account verification */
    const result = await sentEmail(body.email, subject, html);
    if (!result) {
      return next(Boom.badData(authControllerResponse.sentVerifyEmailFailure))
    }
    if (user && !user.verificationCode) {
      await usersService.updateUser({ verificationCode }, { _id: user._id })
      return res.status(200).send({ message: authControllerResponse.verifyEmailRequest })
    }
    if (body.image) {
      const s3File: any = await uploadFileToS3(body.image, `user-${verificationCode}`, s3Bucket)
      body.image = s3File.name
    }

    const data: any = {
      image: body.image ? body.image : '',
      email: body.email,
      password: body.password,
      device: body.device,
      type: 'User',
      status: 'Deactive',
      verified: false,
      verificationCode
    }
    /** Store In app subscription */
    if (body.subscription && body.inAppSubscription) {
      data.inAppSubscription = { ...body.inAppSubscription, createdAt: new Date() }
      data.inAppSubscriptionStatus = 'Active'
      data.subscription = body.subscription
    }

    await usersService.createUser(data)
    res.status(200).send({ message: authControllerResponse.verifyEmailRequest })
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/** Verify User signup */
const verifyUserSignUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token as string
    const decryptToken: any = verifyToken(token)
    const code = decryptToken.code
    const email = decryptToken.email
    /** Get user from db */
    const user: any = await usersService.getOneUserByFilter({ verificationCode: code, email })
    if (!user) {
      return next(Boom.notFound(authControllerResponse.getUserError))
    }
    let body: any = {
      verified: true,
      status: 'Active',
      device: user.referralUserId && req.query.device ? req.query.device : user.device,
      $unset: { verificationCode: 1 }
    }
    if (!user.inAppSubscription && user.device === 'web' && !user.referralUserId) {
      const subscriptionDetails = await subscriptionsService.getOneSubscriptionByFilter({ duration: 'Month' })
      if (!subscriptionDetails || !subscriptionDetails.stripePlanId) {
        return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
      }

      /** Create stripe customer */
      const customer = await stripeSubscriptionService.createCustomer(email)
      /** Create stripe subscription */
      const subscription = await stripeSubscriptionService.createSubscription(subscriptionDetails.stripePlanId, customer.id)
      body.stripe = {
        planId: subscriptionDetails.stripePlanId,
        subscriptionId: subscription.id,
        customerId: customer.id,
        createdAt: new Date()
      }
      body.subscription = subscriptionDetails._id
    }

    await usersService.updateUser(body, { _id: user._id })

    const title = 'Welcome to Holyreads';
    const description = 'Enjoy best summaries audio and video';
    await notificationsService.createNotification({ userId: user._id, type: 'user', notification: { title, description } })

    /** Get welcome email template */
    const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.welcomeToHolyreads })
    const subject = emailTemplateDetails?.subject || 'Welcome To Holy Reads'
    let html = `<p>Dear ${email.split('@')[0]},</p><p>Welcome To Holy Reads</p><br /><p>We’re excited to have you get started. Just press the button below.</p><br /><p><button><a href="${origins[NODE_ENV]}/account/login">Here</a></button></p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

    if (emailTemplateDetails && emailTemplateDetails.content) {
      const contentData = { loginURL: `${origins[NODE_ENV]}/account/login` }
      const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
      if (htmlData) {
        html = htmlData
      }
    }
    /** sent welcome email */
    const result = await sentEmail(email, subject, html);
    if (!result) {
      return next(Boom.badData(authControllerResponse.sentVerifyEmailFailure))
    }
    res.status(200).send({ message: authControllerResponse.signUpSuccess })
    /** Push notification */
    if (user && user.pushTokens && user.pushTokens.length && user?.notification?.push) {
      const tokens = user.pushTokens.map(i => i.token)
      pushNotification(tokens, title, description)
      if (
        user?.notification?.subscription &&
        user.device === 'web' &&
        !user.inAppSubscription &&
        !user.referralUserId
      ) pushNotification(tokens, 'Holyreads Trial Subscription', 'Holyreads Subscription has been activated with 3 days trial period')
    }
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/** Process forgot password request */
const forgotPassoword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.body.email
    /** Get user from db */
    const user: any = await usersService.getOneUserByFilter({ email, type: 'User' })
    if (!user) {
      return next(Boom.notFound(authControllerResponse.getUserError))
    }
    const verificationCode = Math.floor(1000 + Math.random() * 9000)
    const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.forgotPassword })
    const subject = emailTemplateDetails.subject || 'Verification Code'
    let html = `<h4>Your verification code is: ${verificationCode}<h4>`

    if (emailTemplateDetails && emailTemplateDetails.content) {
      const contentData = { otp: verificationCode, username: email.substr(0, email.indexOf('@')) }
      const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
      if (htmlData) {
        html = htmlData
      }
    }
    const result = await sentEmail(email, subject, html);
    if (!result) {
      return next(Boom.badData(adminControllerResponse.sendCodeFailure))
    }
    await usersService.updateUser({ verificationCode }, { _id: user._id })
    res.status(200).send({
      message: adminControllerResponse.sendCodeSuccess
    })
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/**  verify new password */
const verifyPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { newPassword, code }: any = req.body
    if (!newPassword) {
      return next(Boom.badData(adminControllerResponse.passwordMissingError))
    }
    /** Get user from db */
    const userObj: any = await usersService.getOneUserByFilter({ verificationCode: code, type: 'User' })
    if (!userObj) {
      return next(Boom.notFound(adminControllerResponse.codeVerificationFailure))
    }
    await usersService.updateUser({ password: newPassword, $unset: { verificationCode: 1 } }, { _id: userObj._id })
    res.status(200).send({ message: adminControllerResponse.forgotPassowrdSuccess })
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/** App oAuth Signin */
const appOAuthSignIn = async (req: Request, res: any, next: NextFunction) => {
  try {
    const body: any = req.body
    if (!body.id || !body.provider) {
      return next(Boom.notFound(authControllerResponse.missingoAuthKeyError))
    }
    const query: any = { 'oAuth.clientId': body.id, 'oAuth.provider': body.provider }
    const user: any = await usersService.getOneUserByFilter(query)
    /** unauthorised if user type is admin */
    if (user?.type === 'Admin') {
      return next(Boom.unauthorized(authControllerResponse.userNotAuthorizationError))
    }
    /** unauthorised if user missing */
    if (!user) {
      return next(Boom.notFound(authControllerResponse.missingSocialAccountError))
    }
    const token: string = getToken({ email: user.email, 'oauthClientId': body.id, id: user._id, isNewLogin: String(!user.loginAt) })
    res.status(200).json({
      message: authControllerResponse.loginSuccess,
      data: { _id: user._id, email: user.email, token, type: user.type, userName: user?.email?.split('@')[0] || '' }
    })
    await usersService.updateUser({ loginAt: new Date() }, { _id: user._id });
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/** App oAuth signup */
const appOAuthSignUp = async (req: Request, res: any, next: NextFunction) => {
  try {
    const body: any = req.body
    if (!body.id || !body.provider) {
      return next(Boom.notFound(authControllerResponse.missingoAuthKeyError))
    }
    if (!body.email && body.provider.toLowerCase() === 'apple') {
      return next(Boom.notFound(authControllerResponse.missingAppleEmailError))
    }
    if (!body.email) {
      return next(Boom.notFound(authControllerResponse.missingEmailError))
    }

    const query: any = { 'oAuth.clientId': body.id, 'oAuth.provider': body.provider }
    const user: any = await usersService.getOneUserByFilter(query)
    /** User shoulde not create if oauth client exist */
    if (user) {
      return next(Boom.conflict(authControllerResponse.userAlreadyExistError))
    }
    const emailUser: any = await usersService.getOneUserByFilter({ email: body.email })

    /** if emailuser exist then link oauth */
    if (emailUser) {
      emailUser.oAuth = !emailUser.oAuth ? [] : emailUser.oAuth
      const index = emailUser.oAuth.findIndex(i => i.provider === body.provider);
      (index < 0) ?
        emailUser.oAuth.push({
          email: body.email,
          provider: body.provider,
          clientId: body.id,
          default: emailUser?.oAuth?.length ? false : true
        })
        :
        emailUser.oAuth[index] = { ...emailUser.oAuth[index], email: body.email }
      await usersService.updateUser({ oAuth: emailUser.oAuth, loginAt: new Date() }, { _id: emailUser._id })
      const token: string = getToken({ email: emailUser.email, 'oauthClientId': body.id, id: emailUser._id, isNewLogin: String(!emailUser.loginAt) })
      return res.status(200).json({
        message: authControllerResponse.loginSuccess,
        data: { _id: emailUser._id, email: emailUser.email || '', token, type: emailUser.type, userName: emailUser.email.split('@')[0] || '' }
      })
    }
    if (body.photoUrl) {
      await axios.get(body.photoUrl, { responseType: 'arraybuffer' }).then(async (response) => {
        const data = "data:" + response.headers["content-type"] + ";base64," + Buffer.from(response.data).toString('base64');
        const s3File: any = await uploadFileToS3(data, `profile`, s3Bucket)
        body.photoUrl = s3File.name
      })
    }

    const newBody: any = {
      image: body.photoUrl ? body.photoUrl : '',
      type: 'User',
      status: 'Active',
      verified: true,
      oAuth: [{
        clientId: body.id,
        provider: body.provider,
        email: body.email,
        default: true
      }],
      device: body?.device?.toLowerCase() || '',
      email: body.email
    }
    if (body.subscription && body.inAppSubscription) {
      const subscriptionDetails = await subscriptionsService.getOneSubscriptionByFilter({ _id: body.subscription })
      if (!subscriptionDetails || !subscriptionDetails.stripePlanId) {
        return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
      }
      newBody.inAppSubscription = { ...body.inAppSubscription, createdAt: new Date() }
      newBody.inAppSubscriptionStatus = 'Active'
      newBody.subscription = subscriptionDetails._id
    }
    /** Create new user using social login */
    const data: any = await usersService.createUser({ ...newBody, loginAt: new Date() })
    const token: string = getToken({ email: data.email, 'oauthClientId': body.id, id: data._id, isNewLogin: String(true) })
    const title = 'Welcome to Holyreads';
    const description = 'Enjoy best summaries audio and video';

    await notificationsService.createNotification({ userId: data._id, type: 'user', notification: { title, description } })

    /** Get welcome email template */
    const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.welcomeToHolyreads })
    const subject = emailTemplateDetails?.subject || 'Welcome To Holy Reads'
    let html = `<p>Dear ${body.email.split('@')[0]},</p><p>Welcome To Holy Reads</p><br /><p>We’re excited to have you get started. Just press the button below.</p><br /><p><button><a href="${origins[NODE_ENV]}/account/login">Here</a></button></p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

    if (emailTemplateDetails && emailTemplateDetails.content) {
      const contentData = { loginURL: `${origins[NODE_ENV]}/account/login` }
      const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
      if (htmlData) {
        html = htmlData
      }
    }
    /** sent welcome email */
    const result = await sentEmail(body.email, subject, html);
    if (!result) {
      return next(Boom.badData(authControllerResponse.sentVerifyEmailFailure))
    }
    res.status(200).json({
      message: authControllerResponse.loginSuccess,
      data: { _id: data._id, email: data.email || '', token, type: newBody.type, userName: body?.email?.split('@')[0] || '' }
    })

    /** Push notification */
    if (data && data.pushTokens && data.pushTokens.length && data?.notification?.push) {
      const tokens = data.pushTokens.map(i => i.token)
      /** sent wellcome notification in app */
      pushNotification(tokens, title, description)
      if (data?.notification?.subscription && body.subscription && body.inAppSubscription)
        pushNotification(tokens, 'Holyreads Subscription', 'Holyreads subscription has been activated!')
    }
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/** oAuth Login */
const oAuthLogin = async (req: Request, res: any, next: NextFunction) => {
  try {
    const body: any = req.body
    if (!body.id || !body.provider) {
      return next(Boom.notFound(authControllerResponse.missingoAuthKeyError))
    }
    if (!body.email && body.provider.toLowerCase() === 'apple') {
      return next(Boom.notFound(authControllerResponse.missingAppleEmailError))
    }
    if (!body.email) {
      return next(Boom.notFound(authControllerResponse.missingEmailError))
    }

    const query: any = { 'oAuth.clientId': body.id, 'oAuth.provider': body.provider }
    const user: any = await usersService.getOneUserByFilter(query)
    if (user?.type === 'Admin') {
      return next(Boom.unauthorized(authControllerResponse.userNotAuthorizationError))
    }

    const emailUser: any = await usersService.getOneUserByFilter({ email: body.email })
    const isEmailConflicts = emailUser && String(emailUser._id) !== String(user?._id) ? true : false
    if (user) {
      user.email = !user.email && !isEmailConflicts ? body.email : user.email
      const index = emailUser.oAuth.findIndex(i => i.provider === body.provider)
      /** set email if email does not exist */
      user.oAuth[index] = { ...user.oAuth[index], email: user.email }
      await usersService.updateUser({ oAuth: user.oAuth, email: user.email, loginAt: new Date() }, { _id: user._id })
      const token: string = getToken({ email: user.email, 'oauthClientId': body.id, id: user._id, isNewLogin: String(!user.loginAt) })
      return res.status(200).json({
        message: authControllerResponse.loginSuccess,
        data: { _id: user._id, email: user.email, token, type: user.type, userName: user?.email?.split('@')[0] || '' }
      })
    }
    /** if emailuser exist then link oauth */
    if (emailUser) {
      emailUser.oAuth = emailUser?.oAuth?.length ? emailUser.oAuth : []
      const index = emailUser.oAuth.findIndex(i => i.provider === body.provider);
      (index < 0)
        ? emailUser.oAuth.push({
            email: body.email,
            provider: body.provider,
            clientId: body.id,
            default: emailUser?.oAuth?.length ? false : true
          })
        : emailUser.oAuth[index] = { ...emailUser.oAuth[index], email: body.email }
      await usersService.updateUser({ oAuth: emailUser.oAuth, loginAt: new Date() }, { _id: emailUser._id })

      const token: string = getToken({ email: emailUser.email, 'oauthClientId': body.id, id: emailUser._id, isNewLogin: String(!user.loginAt) })
      return res.status(200).json({
        message: authControllerResponse.loginSuccess,
        data: { _id: emailUser._id, email: emailUser.email, token, type: emailUser.type, userName: emailUser?.email?.split('@')[0] || '' }
      })
    }
    if (body.photoUrl) {
      await axios.get(body.photoUrl, { responseType: 'arraybuffer' }).then(async (response) => {
        const data = "data:" + response.headers["content-type"] + ";base64," + Buffer.from(response.data).toString('base64');
        const s3File: any = await uploadFileToS3(data, `profile`, s3Bucket)
        body.photoUrl = s3File.name
      })
    }

    const newBody: any = {
      image: body.photoUrl ? body.photoUrl : '',
      type: 'User',
      status: 'Active',
      verified: true,
      oAuth: [{
        clientId: body.id,
        provider: body.provider,
        email: body.email,
        default: true
      }],
      device: 'web',
      email: body.email
    }
    const subscriptionDetails = await subscriptionsService.getOneSubscriptionByFilter({ duration: 'Month' })
    if (!subscriptionDetails || !subscriptionDetails.stripePlanId) {
      return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
    }

    const customer = await stripeSubscriptionService.createCustomer(body.email as any)
    /** Create trial subscription */
    const subscription = await stripeSubscriptionService.createSubscription(subscriptionDetails.stripePlanId, customer.id)
    newBody.stripe = {
      planId: subscriptionDetails.stripePlanId,
      subscriptionId: subscription.id,
      customerId: customer.id,
      createdAt: new Date()
    }
    newBody.subscription = subscriptionDetails._id

    const data: any = await usersService.createUser({ ...newBody, loginAt: new Date() })
    const token: string = getToken({ email: data.email, 'oauthClientId': body.id, id: data._id, isNewLogin: String(true) })
    const title = 'Welcome to Holyreads';
    const description = 'Enjoy best summaries audio and video';
    await notificationsService.createNotification({ userId: data._id, type: 'user', notification: { title, description } })

    /** Get welcome email template */
    const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.welcomeToHolyreads })
    const subject = emailTemplateDetails?.subject || 'Welcome To Holy Reads'
    let html = `<p>Dear ${body.email.split('@')[0]},</p><p>Welcome To Holy Reads</p><br /><p>We’re excited to have you get started. Just press the button below.</p><br /><p><button><a href="${origins[NODE_ENV]}/account/login">Here</a></button></p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`
    if (emailTemplateDetails && emailTemplateDetails.content) {
      const contentData = { loginURL: `${origins[NODE_ENV]}/account/login` }
      const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
      if (htmlData) {
        html = htmlData
      }
    }

    /** sent welcome email */
    const result = await sentEmail(body.email, subject, html);
    if (!result) {
      return next(Boom.badData(authControllerResponse.sentVerifyEmailFailure))
    }

    res.status(200).json({
      message: authControllerResponse.loginSuccess,
      data: { _id: data._id, email: data.email || '', token, type: newBody.type, userName: body?.email?.split('@')[0] || '' }
    })

    /** Push notification */
    if (data && data.pushTokens && data.pushTokens.length && data?.notification?.push) {
      const tokens = data.pushTokens.map(i => i.token)
      pushNotification(tokens, title, description)
      pushNotification(tokens, 'Holyreads Trial Subscription', '3 days trial subscription has been activated!')
    }

  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

export default {
  signInUser,
  verifyUserSignUp,
  signUpUser,
  forgotPassoword,
  verifyPassword,
  appOAuthSignUp,
  appOAuthSignIn,
  oAuthLogin,
}
