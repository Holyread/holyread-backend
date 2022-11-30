import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import { encrypt, getToken, verifyToken, sentEmail, pushNotification, imageUrlToBase64 } from '../../lib/utils/utils'
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
import transactionsService from '../../services/customers/users/transactions.service';

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
    const token: string = getToken({ email: user.email, id: user._id })
    res.status(200).json({
      message: authControllerResponse.loginSuccess,
      data: { _id: user._id, email: user.email, token, type: user.type }
    })
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
    let html = `<p>Dear ${body.email.split('@')[0]},</p><p>Thank you for registering with Holy Reads.</p><p>Your customer account details are below:</p><p>Email : ${body.email}</p><p>Please enter this code ${verificationCode} <!-- <a href="${link}">Here</a> --> to verify your registration.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`
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
      await usersService.updateUser({ _id: user._id }, { verificationCode })
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
    const now: Date = new Date()
    let subscriptionEndDate: Date;
    if (body.subscription && body.inAppSubscription) {
      data.inAppSubscription = { ...body.inAppSubscription, createdAt: now }
      data.inAppSubscriptionStatus = 'Active'
      data.subscription = body.subscription
    }
    const newUser = await usersService.createUser(data)

    res.status(200).send({ message: authControllerResponse.verifyEmailRequest })

    if (!body.inAppSubscription) return;

    let months = subscriptionDetails.duration === 'Month' ? 1 : subscriptionDetails.duration === 'Half Year' ? 6 : 12;
    subscriptionEndDate = new Date(new Date(now).setMonth(new Date(now).getMonth() + months))

    /** Create transaction */
    transactionsService.createTransaction({
      latestInvoice: '',
      planCreatedAt: now,
      planExpiredAt: subscriptionEndDate,
      userId: newUser._id,
      total: subscriptionDetails.price,
      status: 'active',
      paymentMethod: null,
      reason: '',
      paymentLink: '',
      device: 'app'
    })
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/** Verify User signup */
const verifyUserSignUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token as string
    let user: any;
    let body: any = {};
    if (!req?.query?.token && !req?.query?.code) {
      return next(Boom.notAcceptable(authControllerResponse.invalidCodeOrTokenError))
    }

    if (token) {
      const decryptToken: any = verifyToken(token)
      body.email = decryptToken.email
      body.verificationCode = decryptToken.code
    } {
      body.verificationCode = req.query.code;
    }

    /** Get user from db */
    user = await usersService.getOneUserByFilter(body)
    if (!user) {
      return next(Boom.notFound(authControllerResponse.getUserError))
    }

    body = {
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
      const customer = await stripeSubscriptionService.createCustomer(user.email)
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

    await usersService.updateUser({ _id: user._id }, body)

    const title = 'Welcome to Holy Reads 🎉';
    const description = 'Enjoy summaries of bestselling Christian books 📚';
    await notificationsService.createNotification({ userId: user._id, type: 'user', notification: { title, description } })

    /** Get welcome email template */
    const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.welcomeToHolyreads })
    const subject = emailTemplateDetails?.subject || 'Welcome To Holy Reads'
    let html = `<p>Dear ${user.email.split('@')[0]},</p><p>Welcome To Holy Reads</p><br /><p>We’re excited to have you get started. Just press the button below.</p><br /><p><button><a href="${origins[NODE_ENV]}/account/login">Here</a></button></p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

    if (emailTemplateDetails && emailTemplateDetails.content) {
      const contentData = { loginURL: `${origins[NODE_ENV]}/account/login` }
      const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
      if (htmlData) {
        html = htmlData
      }
    }
    /** sent welcome email */
    const result = await sentEmail(user.email, subject, html);
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
      ) pushNotification(tokens, 'Holy Reads Free Plan 🔔', 'Enjoy 3 Days free trial with holy reads best summaries📚');
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
    await usersService.updateUser({ _id: user._id }, { verificationCode })
    res.status(200).send({
      message: adminControllerResponse.sendVerificationEmailSuccess
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
    await usersService.updateUser({ _id: userObj._id }, { password: newPassword, $unset: { verificationCode: 1 } })
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
    const token: string = getToken({ email: user.email, 'oauthClientId': body.id, id: user._id })
    res.status(200).json({
      message: authControllerResponse.loginSuccess,
      data: { _id: user._id, email: user.email, token, type: user.type, userName: user?.email?.split('@')[0] || '' }
    })

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

      await usersService.updateUser({ _id: emailUser._id }, { oAuth: emailUser.oAuth })

      const token: string = getToken({ email: emailUser.email, 'oauthClientId': body.id, id: emailUser._id })
      return res.status(200).json({
        message: authControllerResponse.loginSuccess,
        data: { _id: emailUser._id, email: emailUser.email || '', token, type: emailUser.type, userName: emailUser.email.split('@')[0] || '' }
      })
    }
    let base64: any;
    if (body.photoUrl) {
      base64 = await imageUrlToBase64(body.photoUrl);
    }

    if (base64) {
      const s3File: any = await uploadFileToS3(base64, `profile`, s3Bucket)
      body.photoUrl = s3File.name
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
    const subscriptionDetails = await subscriptionsService.getOneSubscriptionByFilter({ _id: body.subscription })
    if (body.subscription && body.inAppSubscription) {
      if (!subscriptionDetails || !subscriptionDetails.stripePlanId) {
        return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
      }
      newBody.inAppSubscription = { ...body.inAppSubscription, createdAt: new Date() }
      newBody.inAppSubscriptionStatus = 'Active'
      newBody.subscription = subscriptionDetails._id
    }
    /** Create new user using social login */
    const data: any = await usersService.createUser(newBody)
    const token: string = getToken({ email: data.email, 'oauthClientId': body.id, id: data._id })
    const title = 'Welcome to Holy Reads 🎉';
    const description = 'Enjoy summaries of bestselling Christian books 📚';
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
        pushNotification(tokens, 'Holy Reads Subscription', `Holy Reads ${subscriptionDetails.duration.includes('Half') ? subscriptionDetails.duration : '1 ' + subscriptionDetails.duration} subscription has been activated! 🎉`)
    }
    if (!newBody.inAppSubscription) return;
    const now = new Date();
    let months = subscriptionDetails.duration === 'Month' ? 1 : subscriptionDetails.duration === 'Half Year' ? 6 : 12;
    const subscriptionEndDate = new Date(new Date(now).setMonth(new Date(now).getMonth() + months))

    /** Create transaction */
    transactionsService.createTransaction({
      latestInvoice: '',
      planCreatedAt: now,
      planExpiredAt: subscriptionEndDate,
      userId: data._id,
      total: subscriptionDetails.price,
      status: 'active',
      paymentMethod: null,
      reason: '',
      paymentLink: '',
      device: 'app'
    })
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
      const index = user.oAuth.findIndex(i => i.provider === body.provider)
      /** set email if email does not exist */
      user.oAuth[index] = { ...user.oAuth[index], email: user.email }

      await usersService.updateUser({ _id: user._id }, { oAuth: user.oAuth, email: user.email })

      const token: string = getToken({ email: user.email, 'oauthClientId': body.id, id: user._id })
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
        : emailUser.oAuth[index] = { ...emailUser.oAuth[index], clientId: body.id, email: body.email }

      await usersService.updateUser({ _id: emailUser._id }, { oAuth: emailUser.oAuth })

      const token: string = getToken({ email: emailUser.email, 'oauthClientId': body.id, id: emailUser._id })
      return res.status(200).json({
        message: authControllerResponse.loginSuccess,
        data: { _id: emailUser._id, email: emailUser.email, token, type: emailUser.type, userName: emailUser?.email?.split('@')[0] || '' }
      })
    }

    let base64: any;
    if (body.photoUrl) {
      base64 = await imageUrlToBase64(body.photoUrl)
    }

    if (base64) {
      const s3File: any
        = await uploadFileToS3(base64, `profile`, s3Bucket)
      body.photoUrl = s3File.name
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

    const data: any = await usersService.createUser(newBody)
    const token: string = getToken({ email: data.email, 'oauthClientId': body.id, id: data._id })
    const title = 'Welcome to Holy Reads 🎉';
    const description = 'Enjoy summaries of bestselling Christian books 📚';
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
      pushNotification(tokens, 'Holy Reads Free Plan 🔔', 'Enjoy 3 Days free trial with holy reads best summaries📚')
    }

  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/** Resend signUp Email */
const resendSignUpEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params: { email: string } = req.body
    const user = await usersService.getOneUserByFilter({ email: params.email })

    if (!user) {
      return next(Boom.badData(authControllerResponse.userNotAuthorizationError))
    }
    if (user && user.verified) {
      return next(Boom.conflict(authControllerResponse.userAlreadyVerifiedError))
    }

    const verificationCode = user.verificationCode || Math.floor(1000 + Math.random() * 9000)
    const token: string = getToken({ code: String(verificationCode), email: params.email })
    const link: string = `${origins[NODE_ENV]}/account/verify-user?token=${token}`
    const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.registration })
    const subject = emailTemplateDetails?.subject || 'Account Verification'
    let html = `<p>Dear ${params.email.split('@')[0]},</p><p>Thank you for registering with Holy Reads.</p><p>Your customer account details are below:</p><p>Email : ${params.email}</p><p>Please click <a href="${link}">Here</a> to verify your registration.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

    if (emailTemplateDetails && emailTemplateDetails.content) {
      const contentData = { link, code: verificationCode, username: params.email.split('@')[0] }
      const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
      if (htmlData) {
        html = htmlData
      }
    }

    const result = await sentEmail(params.email, subject, html);
    if (!result) {
      return next(Boom.badData(adminControllerResponse.sentEmailFailure))
    }

    res.status(200).send({
      message: adminControllerResponse.sendVerificationEmailSuccess
    })

    usersService.updateUser({ _id: user._id }, { verificationCode })
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}


export default {
  signInUser,
  signUpUser,
  oAuthLogin,
  verifyPassword,
  appOAuthSignUp,
  appOAuthSignIn,
  forgotPassoword,
  verifyUserSignUp,
  resendSignUpEmail,
}
