import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import { encrypt, getToken } from '../../lib/utils/utils'
import usersService from '../../services/users/user.service'
import { sentEmail } from '../../lib/utils/utils'
import { responseMessage } from '../../constants/message.constant'

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
    const code = Math.floor(100000 + Math.random() * 900000)
    const result = await sentEmail(params.email, 'Verification Code', `Your verification code is: ${code}`);
    if (!result) {
      return next(Boom.badData(adminControllerResponse.sentEmailFailure))
    }
    const updatedUserDetails = await usersService.updateUser({ code }, user._id)
    if (!updatedUserDetails || updatedUserDetails.code !== code) {
      return next(Boom.badData(adminControllerResponse.forgotPassowrdFailure))
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
    const user = await usersService.getOneUserByFilter({ code: params.code, type: 'Admin' })
    if (!user) {
      return next(Boom.badData(authControllerResponse.userNotAuthorizationError))
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

/** Process forgot password request */
const forgotPassoword = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const email = req.body.email
      /** Get user from db */
      const user: any = await usersService.getOneUserByFilter({ email, type: 'Admin' })
      if (!user) {
          return next(Boom.badData(adminControllerResponse.getAdminFailure))
      }
      const code = Math.floor(100000 + Math.random() * 900000)
      const result = await sentEmail(email, 'Verification Code', `Your verification code is: ${code}`);
      if (!result) {
          return next(Boom.badData(adminControllerResponse.forgotPassowrdFailure))
      }
      await usersService.updateUser({ code }, user._id)
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
      const { email, newPassword, code }: any = req.body
      /** Get user from db */
      const userObj: any = await usersService.getOneUserByFilter({ email, code, type: 'Admin' })
      if (!userObj) {
          return next(Boom.notFound(adminControllerResponse.forgotPassowrdFailure))
      }
      await usersService.updateUser({ password: newPassword, $unset: { code: 1 } }, userObj._id)
      res.status(200).send({ message: adminControllerResponse.forgotPassowrdSuccess })
  } catch (e: any) {
      next(Boom.badData(e.message))
  }
}

/**  change password */
const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const { email, password, newPassword }: any = req.body
      /** Get user from db */
      const userObj: any = await usersService.getOneUserByFilter({ email, password: encrypt(password), type: 'Admin' })
      if (!userObj) {
          return next(Boom.notFound(adminControllerResponse.forgotPassowrdFailure))
      }
      await usersService.updateUser({ password: newPassword }, userObj._id)
      res.status(200).send({ message: adminControllerResponse.forgotPassowrdSuccess })
  } catch (e: any) {
      next(Boom.badData(e.message))
  }
}

export default { signInUser, verifySignInOtp, forgotPassoword, verifyPassword, changePassword }
