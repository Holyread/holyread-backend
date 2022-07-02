import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import axios from 'axios';

import { encrypt, getToken, verifyToken, sentEmail, pushNotification } from '../../lib/utils/utils'
import usersService from '../../services/admin/users/user.service'
import emailTemplateService from '../../services/admin/emailTemplate/emailTemplate.service'
import { responseMessage } from '../../constants/message.constant'
import { origins, emailTemplatesTitles } from '../../constants/app.constant'
import { uploadImageToAwsS3, compileHtml } from '../../lib/utils/utils'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'
import notificationsService from '../../services/customers/notifications/notifications.service';
import { fetchNotifications } from './notification.controller';
import { io } from '../../app';

const authControllerResponse = responseMessage.authControllerResponse
const adminControllerResponse = responseMessage.adminControllerResponse
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
      return next(Boom.badData(authControllerResponse.userNotAuthorizationError))
    }
    if (user && user.status !== 'Active') {
      return next(Boom.badData(authControllerResponse.userNotActivatedError))
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
    const user: any = await usersService.getOneUserByFilter({ email: req.body.email })
    if (user && !user.verified) {
      return res.status(200).send({ message: authControllerResponse.verifyEmailSuccess })
    }
    if (user && user.verified) {
      return next(Boom.badData(authControllerResponse.userAlreadyExistError))
    }
    const verificationCode = Math.floor(1000 + Math.random() * 9000)
    const token: string = getToken({ code: String(verificationCode), email: body.email })
    const link: string = `${origins[NODE_ENV]}/account/verify-user?token=${token}`
    const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.registration })
    const subject = emailTemplateDetails?.subject || 'Verification Mail'
    let html = `<p>Please click this link for verify account - <a href="${link}" alt='verification link'>link</a><p>`
    
    if (emailTemplateDetails && emailTemplateDetails.content) {
      const contentData = { email: body.email, password: body.password, username: body.email.substr(0, body.email.indexOf('@')), link }
      const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
      if (htmlData) {
        html = htmlData
      }
    }
    const result = await sentEmail(body.email, subject, html);
    if (!result) {
      return next(Boom.badData(authControllerResponse.sentVerifyEmailFailure))
    }
    if (user && !user.verificationCode) {
      await usersService.updateUser({
        verificationCode
      }, user._id)
      return res.status(200).send({ message: authControllerResponse.verifyEmailRequest })
    }
    if (body.image) {
      body.image = await uploadImageToAwsS3(body.image, `user-${verificationCode}`, s3Bucket)
    }
    await usersService.createUser({
      image: body.image ? body.image : '',
      email: body.email,
      password: body.password,
      type: 'User',
      status: 'Deactive',
      verified: false,
      verificationCode
    })
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
      return next(Boom.badData(authControllerResponse.getUserError))
    }
    await usersService.updateUser({
      verified: true,
      status: 'Active',
      $unset: { verificationCode: 1 }
    }, user._id)
    const title = 'Welcome';
    const description = 'Welcome to the holyreads';
    await notificationsService.createNotification({ userId: user._id, type: 'user', notification: { title, description } })
    fetchNotifications(io.sockets, { _id: user._id })
    res.status(200).send({ message: authControllerResponse.signUpSuccess })
    /** Push notification */
    if (user && user.pushTokens && user.pushTokens.length && user.pushNotification) {
      const tokens = user.pushTokens.map(i => i.token)
      pushNotification(tokens, title, description)
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
      return next(Boom.badData(authControllerResponse.getUserError))
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
    await usersService.updateUser({ verificationCode }, user._id)
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
      return next(Boom.notFound(adminControllerResponse.passwordMissingError))
    }
    /** Get user from db */
    const userObj: any = await usersService.getOneUserByFilter({ verificationCode: code, type: 'User' })
    if (!userObj) {
      return next(Boom.notFound(adminControllerResponse.codeVerificationFailure))
    }
    await usersService.updateUser({ password: newPassword, $unset: { verificationCode: 1 } }, userObj._id)
    res.status(200).send({ message: adminControllerResponse.forgotPassowrdSuccess })
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/** oAuth Login */
const oAuthLogin = async (req: Request, res: any, next: NextFunction) => {
  try {
    const body: any = req.body
    const query: any = [{ 'oAuth.clientId': body.id, 'oAuth.provider': body.provider }]
    if (body.email) {
      query.push({ email: body.email })
    }
    const user: any = await usersService.getOneUserByFilter({ $or: query })
    if (user && user.email && user.type === 'Admin') {
      return next(Boom.notFound(authControllerResponse.userNotAuthorizationError))
    }
    if (user) {
      const token: string = getToken({ email: user.email, 'oauthClientId': body.id, id: user._id })
      return res.status(200).json({
        message: authControllerResponse.loginSuccess,
        data: { _id: user._id, email: user.email, token, type: user.type, userName: user.firstName }
      })
    }
    if (body.photoUrl) {
      await axios.get(body.photoUrl, { responseType: 'arraybuffer' }).then(async (response) => {
        const data = "data:" + response.headers["content-type"] + ";base64," + Buffer.from(response.data).toString('base64');
        body.photoUrl = await uploadImageToAwsS3(data, `profile`, s3Bucket)
      })
    }
    const newBody: any = {
      image: body.photoUrl ? body.photoUrl : '',
      firstName: body.firstName || body.name || '',
      lastName: body.lastName || body.name || '',
      type: 'User',
      status: 'Active',
      verified: true,
      oAuth: {
        clientId: body.id,
        provider: body.provider
      }
    }
    if (body.email) {
      newBody.email = body.email
    }
    const data: any = await usersService.createUser(newBody)
    const token: string = getToken({ email: data.email, 'oauthClientId': body.id, id: data._id })
    res.status(200).json({
      message: authControllerResponse.loginSuccess,
      data: { _id: data._id, email: data.email || '', token, type: newBody.type, userName: newBody.firstName }
    })
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

export default { signInUser, verifyUserSignUp, signUpUser, forgotPassoword, verifyPassword, oAuthLogin }
