import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/users/user.service'
import subscriptionService from '../../services/subscriptions/subscriptions.service'
import { responseMessage } from '../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3, encrypt } from '../../lib/utils/utils'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'

const adminControllerResponse = responseMessage.adminControllerResponse
const authControllerResponse = responseMessage.authControllerResponse
const NODE_ENV = config.NODE_ENV

const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.usersDirectory}`,
}

/**  Get one user by id */
const getUserAccount = async (req: Request, res: Response, next: NextFunction) => {
      try {
            const id: any = req.params.id
            /** Get user from db */
            const userObj: any = await usersService.getOneUserByFilter({ _id: id })
            if (!userObj) {
                  return next(Boom.notFound(authControllerResponse.getUserError))
            }
            res.status(200).send({ message: authControllerResponse.getUserSuccess, data: userObj })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

const changePassword = async (req: Request, res: Response, next: NextFunction) => {
      try {
            const id: any = req.params.id
            const { password, newPassword }: { password: string, newPassword: string } = req.body;
            /** Get user from db */
            const userObj: any = await usersService.getOneUserByFilter({ _id: id , password: encrypt(password) })
            if (!userObj) {
                  return next(Boom.notFound(authControllerResponse.userInvalidPasswordError))
            }
            await usersService.updateUser({ password: newPassword }, id)
            res.status(200).send({ message: authControllerResponse.passwordUpdateSuccess, data: userObj })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/**  Get user subscription by user id */
const getUserSubscription = async (req: Request, res: Response, next: NextFunction) => {
      try {
            const id: any = req.params.id
            /** Get user from db */
            const data: any = await usersService.getOneUserByFilter({ _id: id })
            if (!data) {
                  return next(Boom.notFound(authControllerResponse.getUserError))
            }
            if (data.subscriptions) {
                  try {
                        data.subscriptions = await subscriptionService.getOneSubscriptionByFilter({ _id: data.subscriptions })
                  } catch (error) {
                        /** Handle get subscription error here */
                  }
            }
            res.status(200).send({ message: authControllerResponse.getUserSuccess, data })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/** Update user account details */
const updateUserAccount = async (req: Request, res: Response, next: NextFunction) => {
      try {
          const id: any = req.params.id
          /** Get user from db */
          const data: any = await usersService.getOneUserByFilter({ _id: id, type: 'Admin' })
          if (!data) {
              return next(Boom.notFound(authControllerResponse.getUserError))
          }
          req.body.email = data.email
          if (req.body.image === null) {
              await removeImageToAwsS3(data.image, s3Bucket)
          }
          if (req.body.image && req.body.image.includes('base64')) {
              await removeImageToAwsS3(data.image, s3Bucket)
              req.body.image = await uploadImageToAwsS3(req.body.image, data.name, s3Bucket)
          }
          if (req.body.image && req.body.image.startsWith('http')) {
              req.body.image = data.image
          }
          await usersService.updateUser(req.body, id)
          return res.status(200).send({ message: adminControllerResponse.updateAdminSuccess })
      } catch (e: any) {
          return next(Boom.badData(e.message))
      }
  }

export { getUserAccount, changePassword, getUserSubscription, updateUserAccount }
