import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import { encrypt, getToken } from '../../lib/utils/utils'
import usersService from '../../services/admin/users/user.service'
import emailTemplateService from '../../services/admin/emailTemplate/emailTemplate.service'
import { sentEmail, compileHtml } from '../../lib/utils/utils'
import { responseMessage } from '../../constants/message.constant'
import { emailTemplatesTitles } from '../../constants/app.constant'

const authControllerResponse = responseMessage.authControllerResponse
const adminControllerResponse = responseMessage.adminControllerResponse

/** Confirm admin user signIn with verificationCode */
const signInUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params: { email: string, password: string } = req.body
    const user = await usersService.getOneUserByFilter({ email: params.email, password: encrypt(params.password) })
    if (!user) {
      return next(Boom.badData(authControllerResponse.userNotAuthorizationError))
    }
    const verificationCode = Math.floor(1000 + Math.random() * 9000)
    const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.admin.login })
    const subject = emailTemplateDetails.subject || 'Verification Code'
    let html = `<p>Your verification code is: <b>${verificationCode}</b></p>`

    if (emailTemplateDetails && emailTemplateDetails.content) {
      const contentData = { username: user.email.split('@')[0], otp: verificationCode }
      const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
      if (htmlData) {
        html = htmlData
      }
    }
    const result = await sentEmail(params.email, subject, html);
    if (!result) {
      return next(Boom.badData(adminControllerResponse.sentEmailFailure))
    }
    const updatedUserDetails: any = await usersService.updateUser({ _id: user._id }, { verificationCode })
    if (!updatedUserDetails || updatedUserDetails.verificationCode !== String(verificationCode)) {
      return next(Boom.badData(adminControllerResponse.updateCodeFailure))
    }
    res.status(200).send({
      message: adminControllerResponse.sendCodeSuccess
    })
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/** Resend signIn OTP */
const resendSignInOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params: { email: string } = req.body
    const user = await usersService.getOneUserByFilter({ email: params.email })
    if (!user) {
      return next(Boom.badData(authControllerResponse.userNotAuthorizationError))
    }
    const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.admin.login })
    const subject = emailTemplateDetails.subject || 'Verification Code'
    let html = `<p>Your verification code is: <b>${user.verificationCode}</b></p>`

    if (emailTemplateDetails && emailTemplateDetails.content) {
      const contentData = { username: user.email.split('@')[0], otp: user.verificationCode }
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
      message: adminControllerResponse.sendCodeSuccess
    })
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

/** Confirm admin user signIn with verificationCode */
const verifySignInOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params: { code: string } = req.body
    const user = await usersService.getOneUserByFilter({ verificationCode: params.code, type: 'Admin' })
    if (!user) {
      return next(Boom.badData(authControllerResponse.userNotAuthorizationError))
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

/** Process forgot password request */
const forgotPassoword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.body.email
    /** Get user from db */
    const user: any = await usersService.getOneUserByFilter({ email, type: 'Admin' })
    if (!user) {
      return next(Boom.badData(adminControllerResponse.getAdminFailure))
    }
    const verificationCode = Math.floor(1000 + Math.random() * 9000)
    const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.admin.forgotPassword })
    const subject = emailTemplateDetails.subject || 'Verification Code'
    let html = `<p>Your verification code is: <b>${verificationCode}</b></p>`

    if (emailTemplateDetails && emailTemplateDetails.content) {
      const contentData = { otp: verificationCode }
      const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
      if (htmlData) {
        html = htmlData
      }
    }
    const result = await sentEmail(email, subject, html);
    if (!result) {
      return next(Boom.badData(adminControllerResponse.updateCodeFailure))
    }
    await usersService.updateUser({ _id: user._id }, { verificationCode })
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
    const userObj: any = await usersService.getOneUserByFilter({ verificationCode: code, type: 'Admin' })
    if (!userObj) {
      return next(Boom.notFound(adminControllerResponse.updateCodeFailure))
    }
    await usersService.updateUser({ _id: userObj._id }, { password: newPassword, $unset: { verificationCode: 1 } })
    res.status(200).send({ message: adminControllerResponse.forgotPassowrdSuccess })
  } catch (e: any) {
    next(Boom.badData(e.message))
  }
}

export default { signInUser, resendSignInOtp, verifySignInOtp, forgotPassoword, verifyPassword }
