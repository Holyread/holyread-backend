import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/admin/users/user.service'
import bookService from '../../services/customers/book/bookSummary.service'
import subscriptionService from '../../services/admin/subscriptions/subscriptions.service'
import { responseMessage } from '../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3, encrypt } from '../../lib/utils/utils'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'

const authControllerResponse = responseMessage.authControllerResponse
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse
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
            if (userObj.image) {
                  userObj.image = awsBucket[NODE_ENV].s3BaseURL + '/users/' + userObj.image
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
            const userObj: any = await usersService.getOneUserByFilter({ _id: id, password: encrypt(password) })
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
            const data: any = await usersService.getOneUserByFilter({ _id: id, type: 'User' })
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
            if (req.body.library && req.body.library.saved) {
                  req.body['library.saved'] = req.body.library.saved
            }
            if (req.body.library && req.body.library.completed) {
                  req.body['library.completed'] = req.body.library.completed
            }
            if (req.body.library && req.body.library.reading) {
                  req.body['library.reading'] = req.body.library.reading
            }
            delete req.body.library
            await usersService.updateUser(req.body, id)
            return res.status(200).send({ message: authControllerResponse.userUpdateSuccess })
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

/**  Get one user library by library id */
const getUserLibrary = async (req: Request, res: Response, next: NextFunction) => {
      try {
            const id: any = req.params.id
            const { section, sort, author } = req.query as any
            /** Get user from db */
            const userObj: any = await usersService.getOneUserByFilter({ _id: id })
            if (!userObj) {
                  return next(Boom.notFound(authControllerResponse.getUserError))
            }
            if (section === 'saved' && userObj.library && userObj.library.saved && userObj.library.saved.length) {
                  const search: any = { _id: { $in: userObj.library.saved } }
                  if (author) { search.author = author }
                  const data = await bookService.getAllBookSummaries(0, 0, search, [['createdAt', sort || 'DESC']])
                  res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
                  return
            }
            if (section === 'completed' && userObj.library && userObj.library.completed && userObj.library.completed.length) {
                  const search: any = { _id: { $in: userObj.library.completed } }
                  if (author) { search.author = author }
                  const data = await bookService.getAllBookSummaries(0, 0, search, [['createdAt', sort || 'DESC']])
                  res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
                  return
            }

            if (
                  section === 'reading' && 
                  userObj.library && 
                  userObj.library.reading && 
                  userObj.library.reading.length
            ) {
                  const bookIds = userObj.library.reading.map(oneBook => oneBook.bookId)
                  const search: any = { _id: { $in: bookIds } }
                  if (author) { search.author = author }
                  const data = await bookService.getAllBookSummaries(0, 0, search, [['createdAt', sort || 'DESC']], true)
                  data.summaries = data.summaries.map(oneBook => {
                        const libBookChapters = userObj.library.reading.find(item => String(item.bookId) === String(oneBook._id)).chaptersCompleted
                        oneBook.reads = (libBookChapters && libBookChapters.length ? (100 * libBookChapters.length) / oneBook.chapters.length : 0) + '%'
                        delete oneBook.chapters
                        return oneBook
                  })
                  res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
                  return
            }
            res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data: [] })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

export { getUserAccount, changePassword, getUserSubscription, updateUserAccount, getUserLibrary }
