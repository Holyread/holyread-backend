import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/users/user.service'
import subscriptionService from '../../services/subscriptions/subscriptions.service'
import { responseMessage } from '../../constants/message.constant'
import { encrypt } from '../../lib/utils/utils'

const authControllerResponse = responseMessage.authControllerResponse

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

export { getUserAccount, changePassword, getUserSubscription }
