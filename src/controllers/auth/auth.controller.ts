import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import { encrypt, getToken } from '../../lib/utils/utils'
import { awsBucket } from '../../constants/app.constant'
import usersService from '../../services/users/user.service'
import { uploadImageToAwsS3 } from '../../lib/utils/utils'
import { responseMessage } from '../../constants/message.constant'
import config from '../../../config'

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
  region: awsBucket.region,
  bucketName: awsBucket[NODE_ENV].bucketName,
  documentDirectory: `${awsBucket.usersDirectory}`,
}

const authControllerResponse = responseMessage.authControllerResponse

/** Confirm admin user signIn with verificationCode */
const signInUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params: { email: string, password: string } = req.body
    console.log({ email: params.email, password: encrypt(params.password) })
    const user = await usersService.getOneUserByFilter({ email: params.email, password: encrypt(params.password) })
    if (!user) {
      return next(Boom.badData(authControllerResponse.userNotAuthorizationError))
    }
    const token: string = getToken({ email: user.email })
    res.status(200).json({
      message: authControllerResponse.loginSuccess,
      data: { _id: user._id, email: user.email, token, type: user.type }
    })
  } catch (e) {
    next(Boom.badData(e.message))
  }
}

/** Add User */
const signUpUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    if (!body.parentId) {
      next(Boom.badData(authControllerResponse.parentIdMissingError))
    }
    const parentDetails = await usersService.getOneUserByFilter({ _id: body.parentId, type: 'Admin' })
    if (!parentDetails) {
      return next(Boom.badData(authControllerResponse.getParentDetailsError))
    }
    /** Get user from db */
    const user: any = await usersService.getOneUserByFilter({ email: req.body.email })
    if (user) {
      return next(Boom.badData(authControllerResponse.userAlreadyExistError))
    }
    if (body.image) {
      const fileName = await uploadImageToAwsS3(body.image, body.name, s3Bucket)
      body.image = fileName
    }
    await usersService.createUser({
      name: body.name,
      email: body.email,
      password: body.password,
      image: body.image,
      type: 'User',
      status: 'InActive',
      verified: false
    })
    res.status(200).send({ message: authControllerResponse.signUpSuccess })
  } catch (e) {
    next(Boom.badData(e.message))
  }
}

export default { signInUser, signUpUser }
