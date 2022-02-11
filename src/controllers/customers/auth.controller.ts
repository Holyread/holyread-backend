import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import { encrypt, getToken, verifyToken, sentEmail } from '../../lib/utils/utils'
import usersService from '../../services/admin/users/user.service'
import { responseMessage } from '../../constants/message.constant'
import { origins } from '../../constants/app.constant'
import { uploadImageToAwsS3 } from '../../lib/utils/utils'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'

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
    if (!user) {
      return next(Boom.badData(authControllerResponse.userNotAuthorizationError))
    }
    if (user && user.status !== 'Active') {
      return next(Boom.badData(authControllerResponse.userNotActivatedError))
    }
    const token: string = getToken({ email: user.email })
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
    const token: string = getToken({ code: String(verificationCode) })
    const link: string = `${origins[NODE_ENV]}/account/verify-user?token=${token}`
    const result = await sentEmail(body.email, 'Verification Mail', `Please click this link for verify account - ${link}`);
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
    /** Get user from db */
    const user: any = await usersService.getOneUserByFilter({ verificationCode: code })
    if (!user) {
      return next(Boom.badData(authControllerResponse.getUserError))
    }
    await usersService.updateUser({
      verified: true,
      status: 'Active',
      $unset: { verificationCode: 1 }
    }, user._id)
    res.status(200).send({ message: authControllerResponse.signUpSuccess })
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
    const result = await sentEmail(email, 'Verification Code', `Your verification code is: ${verificationCode}`);
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

export default { signInUser, verifyUserSignUp, signUpUser, forgotPassoword, verifyPassword }
