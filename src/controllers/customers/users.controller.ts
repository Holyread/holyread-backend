import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import { io } from '../../app';
import usersService from '../../services/customers/users/user.service'
import notificationsService from '../../services/customers/notifications/notifications.service'
import { fetchNotifications } from '../../controllers/customers/notification.controller'
import authService from '../../services/admin/users/user.service'
import bookService from '../../services/customers/book/bookSummary.service'
import subscriptionService from '../../services/admin/subscriptions/subscriptions.service'
import stripeSubscriptionService from '../../services/stripe/subscription'
import emailTemplateService from '../../services/admin/emailTemplate/emailTemplate.service'
import { responseMessage } from '../../constants/message.constant'
import { removeS3File, uploadFileToS3, encrypt, compileHtml, sentEmail, pushNotification, verifyToken, getToken, decrypt, sortArrayObject, getTimeDiff } from '../../lib/utils/utils'
import { awsBucket, dataLimit, emailTemplatesTitles, originEmails, origins } from '../../constants/app.constant'
import config from '../../../config'
import ratingService from '../../services/customers/book/rating.service';
import highLightsService from '../../services/customers/highLights/highLights.service';
import userService from '../../services/customers/users/user.service';
import transactionsService from '../../services/customers/users/transactions.service';

const authControllerResponse = responseMessage.authControllerResponse
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse
const subscriptionsControllerResponse = responseMessage.subscriptionsControllerResponse
const NODE_ENV = config.NODE_ENV

const s3Bucket = {
      region: awsBucket.region,
      bucketName: awsBucket[NODE_ENV].bucketName,
      documentDirectory: `${awsBucket.usersDirectory}`,
}

/**  Get one user by id */
const getUserAccount = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            /** Get current user */
            let userObj: any = Object.assign({}, req.user)
            if (userObj.image) {
                  userObj.image = awsBucket[NODE_ENV].s3BaseURL + '/users/' + userObj.image
            }
            userObj.isEmailLinked = !!userObj.password
            let subscriptionDetails = await subscriptionService.getOneSubscriptionByFilter({ _id: userObj.subscription })
            /** set default subscription end date with 3 days trail */
            let subscriptionEndDate = new Date(userObj.createdAt).getTime() + (3 * 24 * 60 * 60 * 1000);
            if (subscriptionDetails?._id) {
                  let months = subscriptionDetails.duration === 'Month' ? 1 : subscriptionDetails.duration === 'Half Year' ? 6 : 12;
                  const createdAt = userObj?.inAppSubscription?.createdAt || userObj?.stripe?.createdAt || new Date()
                  subscriptionEndDate = new Date(createdAt).setMonth(new Date(createdAt).getMonth() + months)
            }
            userObj.subscriptionEndsIn = getTimeDiff(String(new Date()), String(new Date(subscriptionEndDate)))
            delete userObj.password
            delete userObj.library
            delete userObj.smallGroups
            delete userObj.verificationCode
            delete userObj.stripe
            const notifications = await notificationsService.getUserNotifications({ userId: userObj._id })
            userObj.notifications = notifications
            res.status(200).send({ message: authControllerResponse.getUserSuccess, data: userObj })
            await userService.updateUser({ _id: userObj._id }, { lastSeen: new Date() });
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/**  Get one user by id */
const getBlessFriend = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            /** Get current user */
            let userObj: any = await usersService.getOneUserByFilter({ email: req.params.email })
            res.status(200).send({ message: authControllerResponse.getUserSuccess, data: { email: userObj?.email || null } })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

const changePassword = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            const { password, newPassword }: { password: string, newPassword: string } = req.body;
            const userObj = Object.assign({}, req.user)
            if (!password || (newPassword && userObj?.password !== encrypt(password || ''))) {
                  return next(Boom.badData(authControllerResponse.userInvalidPasswordError))
            }
            if (
                  (!newPassword && userObj?.password === encrypt(password || '')) ||
                  (newPassword && userObj?.password === encrypt(newPassword || ''))
            ) {
                  return next(Boom.badData(authControllerResponse.userSamePasswordError))
            }
            await usersService.updateUser({ _id: userObj._id }, { password: newPassword || password })
            const notificationTitle = 'Change Password'
            const notificationDescription = 'Password Changed Successfully'
            await notificationsService.createNotification({ userId: userObj._id, type: 'setting', notification: { title: notificationTitle, description: notificationDescription } })
            fetchNotifications(io.sockets, { _id: userObj._id })
            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.changePassword })

            const sub = emailTemplateDetails.subject || 'Change Password'
            let html = `<p>Dear ${userObj.email.split('@')[0]},</p><p>You have requested a password change on Holyread that succeed.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        username: userObj.email.split('@')[0],
                  }
                  const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                  if (htmlData) {
                        html = htmlData
                  }
            }

            await sentEmail(userObj.email, sub, html);
            res.status(200).send({ message: authControllerResponse.passwordUpdateSuccess })
            /** Push notification */
            if (userObj?.pushTokens?.length && userObj?.notification?.push) {
                  const tokens = userObj.pushTokens.map(i => i.token)
                  pushNotification(tokens, notificationTitle, notificationDescription)
            }
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

const emailAuth = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            const { email, password }: { email: string, password: string } = req.body;
            if (!email || !password) {
                  return next(Boom.notFound(authControllerResponse.missingEmailOrPasswordError))
            }
            const userObj = Object.assign({}, req.user)
            const emailUser = await usersService.getOneUserByFilter({ email, _id: { '$ne': userObj._id } })
            if (emailUser) {
                  return next(Boom.conflict(authControllerResponse.emailAlreadyUsedError))
            }
            if (userObj.email && userObj.password && userObj.email === email) {
                  return res.status(200).send({ message: authControllerResponse.emailAuthExist })
            }
            const verificationCode = Math.floor(1000 + Math.random() * 9000)
            const token: string = getToken({ code: String(verificationCode), email, password: encrypt(password), _id: userObj._id })
            const link: string = `${origins[NODE_ENV]}/account/verify-user?email-auth=true&token=${token}`

            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.emailAuthVerification })
            const sub = emailTemplateDetails.subject || 'Customer Email Auth Verification'
            let html = `<p>Dear ${email.split('@')[0]},</p><p>you requested for email auth.</p><p>Please click <a href="${link}">Here</a> to verify your new email auth.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        username: email.split('@')[0],
                        link
                  }
                  const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                  if (htmlData) {
                        html = htmlData
                  }
            }

            const result = await sentEmail(email, sub, html);
            if (!result) {
                  return next(Boom.badData(authControllerResponse.sentVerifyEmailFailure))
            }
            await usersService.updateUser({ _id: userObj._id }, { verificationCode })
            res.status(200).send({ message: authControllerResponse.verifyEmailRequest })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/** Verify Email Auth */
const verifyEmailAuth = async (req: Request, res: Response, next: NextFunction) => {
      try {
            const token = req.query.token as string
            const decryptToken: any = verifyToken(token)
            const code = decryptToken.code
            const email = decryptToken.email
            const password = decryptToken.password
            const _id = decryptToken._id
            /** Get user from db */
            const user: any = await usersService.getOneUserByFilter({ verificationCode: code, _id })
            if (!user) {
                  return next(Boom.notFound(authControllerResponse.getUserError))
            }

            await usersService.updateUser({ _id: user._id }, {
                  verified: true,
                  status: 'Active',
                  $unset: { verificationCode: 1 },
                  email,
                  password: decrypt(password)
            })

            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.emailAuthEnabled })
            const sub = emailTemplateDetails.subject || 'Customer Email Auth Enabled'
            let html = `<p>Dear ${email.split('@')[0]},</p><p>you requested for email auth that succeed.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        username: email.split('@')[0]
                  }
                  const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                  if (htmlData) {
                        html = htmlData
                  }
            }

            const result = await sentEmail(email, sub, html);
            if (!result) {
                  return next(Boom.notFound(authControllerResponse.sentVerifyEmailFailure))
            }
            const title = 'Email auth enabled';
            const description = 'Now you can access holyreads by using your email and password';
            await notificationsService.createNotification({ userId: user._id, type: 'setting', notification: { title, description } })
            fetchNotifications(io.sockets, { _id: user._id })
            res.status(200).send({ message: authControllerResponse.emailAuthEnabledSuccess })
            /** Push notification */
            if (user && user.pushTokens && user.pushTokens.length && user?.notification?.push) {
                  const tokens = user.pushTokens.map(i => i.token)
                  pushNotification(tokens, title, description)
            }
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/**  Get user subscription by user id */
const getUserSubscription = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            /** Get current user */
            let data: any = Object.assign({}, req.user)
            let subscriptionEndDate = new Date(data.createdAt).getTime() + (3 * 24 * 60 * 60 * 1000);
            if (data.subscription) {
                  try {
                        data.subscription = await subscriptionService.getOneSubscriptionByFilter({ _id: data.subscription })

                        /** set default subscription end date with 3 days trail */
                        if (data.subscription?._id) {
                              let months = data.subscription.duration === 'Month' ? 1 : data.subscription.duration === 'Half Year' ? 6 : 12;
                              const createdAt = data?.inAppSubscription?.createdAt || data?.stripe?.createdAt || new Date()
                              subscriptionEndDate = new Date(createdAt).setMonth(new Date(createdAt).getMonth() + months)
                        }
                  } catch (error) {
                        /** Handle get subscription error here */
                  }
            }
            data.subscriptionEndsIn = getTimeDiff(String(new Date()), String(new Date(subscriptionEndDate)))
            delete data.password
            delete data.library
            delete data.smallGroups
            delete data.verificationCode
            res.status(200).send({ message: authControllerResponse.getUserSuccess, data })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/** Update user account details */
const updateUserAccount = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            /** Get current user */
            let userObj: any = Object.assign({}, req.user)
            const body: any = {
                  email: userObj.email,
                  firstName: req.body.firstName || userObj.firstName,
                  lastName: req.body.lastName || userObj.lastName,
                  notification: {
                        push: typeof eval(req.body?.notification?.push) === 'boolean' ? req.body?.notification?.push : userObj?.notification?.push || false,
                        email: typeof eval(req.body?.notification?.email) === 'boolean' ? req.body?.notification?.email : userObj?.notification?.email || false,
                        inApp: typeof eval(req.body?.notification?.inApp) === 'boolean' ? req.body?.notification?.inApp : userObj?.notification?.inApp || false,
                        subscription: typeof eval(req.body?.notification?.subscription) === 'boolean' ? req.body?.notification?.subscription : userObj?.notification?.subscription || false,
                        dailyDevotional: typeof eval(req.body?.notification?.dailyDevotional) === 'boolean' ? req.body?.notification?.dailyDevotional : userObj?.notification?.dailyDevotional || false,
                        offerAndDeal: typeof eval(req.body?.notification?.offerAndDeal) === 'boolean' ? req.body?.notification?.offerAndDeal : userObj?.notification?.offerAndDeal || false,
                  },
                  downloadOverWifi: typeof eval(req.body?.downloadOverWifi) === 'boolean' ? req.body?.downloadOverWifi : userObj?.downloadOverWifi || false
            }

            if (req.body.kindleEmail) {
                  body.kindleEmail = req.body.kindleEmail
            }
            if (req.body.image === null) {
                  await removeS3File(userObj.image, s3Bucket)
            }
            if (req.body.timeZone) {
                  body.timeZone = req.body.timeZone
            }
            if (req.body.image && req.body.image.includes('base64')) {
                  await removeS3File(userObj.image, s3Bucket)
                  const s3File: any = await uploadFileToS3(req.body.image, 'profile', s3Bucket)
                  body.image = s3File.name
            }
            if (req.body.image && req.body.image.startsWith('http')) {
                  body.image = userObj.image
            }
            if (req.body.pushTokens && req.body.pushTokens.deviceId && req.body.pushTokens.token) {
                  body.pushTokens = req.user.pushTokens || []
                  const pushNotificationIndex = body.pushTokens.findIndex(item => item.deviceId === req.body.pushTokens.deviceId)
                  if (pushNotificationIndex > -1) {
                        body.pushTokens[pushNotificationIndex].token = req.body.pushTokens.token
                  } else {
                        body.pushTokens.push({ deviceId: req.body.pushTokens.deviceId, token: req.body.pushTokens.token })
                  }
            }
            if (req.body.id && req.body.provider) {
                  const userConflicts = await userService.getOneUserByFilter({ 'oAuth.clientId': req.body.id, _id: { '$ne': String(userObj._id) } })
                  if (userConflicts) {
                        return next(Boom.conflict(authControllerResponse.socialLinkError))
                  }
                  const oAuth = userObj.oAuth || []
                  const index = oAuth.findIndex(i => i.provider === req.body.provider)
                  if (index < 0) oAuth.push({ provider: req.body.provider, clientId: req.body.id, email: req.body.oAuthEmail || '' })
                  else {
                        oAuth[index] = { ...oAuth[index], clientId: req.body.id, email: req.body.oAuthEmail || oAuth[index].email || '' }
                  }
                  body.oAuth = oAuth
            }
            if (req.body.provider && req.body.action === 'unlink') {
                  const oAuth = userObj.oAuth || []
                  if (oAuth.length === 1 && oAuth.find(i => i.provider === req.body.provider) && (!userObj.password || !userObj.email)) {
                        return next(Boom.notFound(authControllerResponse.missingEmailAuthError))
                  }
                  body.oAuth = oAuth.filter(i => i.provider !== req.body.provider)
            }
            const subscriptionDetails = await subscriptionService.getOneSubscriptionByFilter({ _id: userObj.subscription });
            const isAppSubscriptionStatus = ['Cancelled', 'Active'].includes(req.body.inAppSubscription?.status) && !!userObj?.inAppSubscriptionStatus && !!req.body.inAppSubscription?.status !== userObj?.inAppSubscriptionStatus

            /** update in App subscription status */
            if (isAppSubscriptionStatus && subscriptionDetails) {
                  body.inAppSubscriptionStatus = req.body.inAppSubscription?.status
            }
            await usersService.updateUser({ _id: userObj._id }, body)
            /** sent email for subscription status updated */
            const notificationTitle = 'Holyreads Subscription'
            const notificationDescription = emailTemplatesTitles.customer.subscriptionActivated ? 'Subscription activated' : 'Subscription cancelled'
            if (isAppSubscriptionStatus && subscriptionDetails) {
                  const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: req.body.inAppSubscription.status === 'Active' ? emailTemplatesTitles.customer.subscriptionActivated : emailTemplatesTitles.customer.subscriptionCancelled })
                  const sub = emailTemplateDetails.subject || `Holyreads Subscription ${req.body.inAppSubscription.status}`
                  let html = `<p>Dear ${userObj.email.split('@')[0]},</p><p>You have ${req.body.inAppSubscription.status} the subscription.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`
                  let now = userObj?.inAppSubscription?.createdAt
                  let subscriptionEndDate;
                  switch (subscriptionDetails.duration) {
                        case "Year":
                              subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 12));
                              break;
                        case "Half Year":
                              subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 6));
                              break;
                        default:
                              subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 1));
                              break;
                  }
                  /** Create transaction */
                  await transactionsService.createTransaction({
                        latestInvoice: '',
                        planCreatedAt: userObj?.inAppSubscription?.createdAt,
                        planExpiredAt: subscriptionEndDate,
                        userId: userObj._id,
                        total: subscriptionDetails.price,
                        status: body.inAppSubscriptionStatus?.toLowerCase(),
                        paymentMethod: null,
                        reason: '',
                        paymentLink: '',
                        device: 'app'
                  })
                  if (emailTemplateDetails && emailTemplateDetails.content) {
                        const contentData = {
                              username: userObj.email.split('@')[0],
                              endDate: subscriptionEndDate,
                              price: subscriptionDetails.price,
                        }
                        const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                        if (htmlData) {
                              html = htmlData
                        }
                  }

                  await notificationsService.createNotification({ userId: userObj._id, type: 'setting', notification: { title: notificationTitle, description: notificationDescription } })
                  fetchNotifications(io.sockets, { _id: userObj._id })

                  const result = await sentEmail(userObj.email, sub, html);
                  if (!result) {
                        return next(Boom.badData(authControllerResponse.sentSubscriptionEmailFilure))
                  }
            }
            res.status(200).send({ message: authControllerResponse.userUpdateSuccess })
            const kindleTitle = userObj.kindleEmail ? 'Update Kindle Email' : 'Add Kindle Email'
            const kindleDescription = userObj.kindleEmail ? 'Kindle email updated' : 'Kindle email Added'
            if (req.body.kindleEmail) {
                  await notificationsService.createNotification({ userId: userObj._id, type: 'setting', notification: { title: kindleTitle, description: kindleDescription } })
                  fetchNotifications(io.sockets, { _id: userObj._id })
            }
            /** Push notification */
            if (userObj.pushTokens.length && userObj?.notification?.push) {
                  const tokens = userObj.pushTokens.map(i => i.token)
                  req.body.kindleEmail && pushNotification(tokens, kindleTitle, kindleDescription)
                  isAppSubscriptionStatus && userObj?.notification?.subscription && pushNotification(tokens, notificationTitle, notificationDescription)
            }
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

/** get share option image url */
const getShareOptionImageUrl = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            if (req.body.image) {
                  const s3File: any = await uploadFileToS3(req.body.image, 'share-image', { ...s3Bucket, documentDirectory: 'users/share-options' })
                  req.body.image = s3File.name
            }
            const imageUrl: string = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.usersDirectory + '/share-options/' + req.body.image
            return res.status(200).send({ message: authControllerResponse.addShareImage, data: { image: imageUrl } })
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

/** Update user library details */
const updateUserLibrary = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            const query: any = { _id: req.user._id }
            const { type, section } = req.query as any
            /** Get user from db */
            const userObj: any = Object.assign({}, req.user)
            if (!section) {
                  return next(Boom.notFound(authControllerResponse.missingSectionParams))
            }
            if (section === 'completed') {
                  req.body['$addToSet'] = { 'library.completed': req.body.completed }
                  delete req.body.completed
            }
            if (type === 'add' && section === 'saved') {
                  req.body['$addToSet'] = { 'library.saved': req.body.saved }
                  delete req.body.saved
            }
            if (type === 'delete' && section === 'saved') {
                  req.body['$pull'] = { 'library.saved': req.body.saved }
                  delete req.body.saved
            }
            if (section === 'reading') {
                  const bookSummary = await bookService.findBook({ _id: req.body.bookId, 'chapters._id': req.body.chapter })
                  if (!bookSummary) {
                        return next(Boom.notFound(bookSummaryControllerResponse.chapterNotExist))
                  }
                  const readingObj = userObj.library?.reading?.find(oneRead => oneRead.bookId === req.body.bookId)
                  if (!readingObj) {
                        if (!userObj?.library) {
                              userObj.library = {}
                        }
                        if (!userObj?.library?.reading) {
                              userObj.library.reading = []
                        }
                        userObj.library.reading.push({
                              bookId: req.body.bookId,
                              chaptersCompleted: [req.body.chapter],
                              updatedAt: new Date()
                        })
                        await usersService.updateUser(query, { library: userObj.library })
                        return res.status(200).send({ message: authControllerResponse.userUpdateSuccess })
                  }

                  query['library.reading.bookId'] = req.body.bookId
                  req.body['$set'] = { 'library.reading.$.updatedAt': new Date() }
                  req.body['$addToSet'] = { 'library.reading.$.chaptersCompleted': req.body.chapter }

                  delete req.body.bookId
                  delete req.body.chapter
            }
            if (section === 'view') {
                  const bookSummary = await bookService.findBook({ _id: req.body.bookId })
                  if (!bookSummary) {
                        return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
                  }
                  const viewObj = userObj.library?.view?.find(bookItem => bookItem.bookId === req.body.bookId)
                  if (!viewObj) {
                        if (!userObj?.library) {
                              userObj.library = {}
                        }
                        if (!userObj?.library?.view) {
                              userObj.library.view = []
                        }
                        userObj.library.view.push({
                              bookId: req.body.bookId,
                              createdAt: new Date()
                        })
                        await usersService.updateUser(query, { library: userObj.library })
                        return res.status(200).send({ message: authControllerResponse.userUpdateSuccess })
                  }

                  query['library.view.bookId'] = req.body.bookId
                  req.body['$set'] = { 'library.view.$.bookId': req.body.bookId }
                  delete req.body.bookId
            }
            /** Add to User small group */
            if (type === 'add' && section === 'smallGroup') {
                  req.body['$addToSet'] = { 'smallGroups': req.body.smallGroup }
                  delete req.body.smallGroup
            }
            /** Delete from User small group */
            if (type === 'delete' && section === 'smallGroup') {
                  req.body['$pull'] = { 'smallGroups': req.body.smallGroup }
                  delete req.body.smallGroup
            }
            await usersService.updateUser(query, req.body)
            return res.status(200).send({ message: authControllerResponse.userUpdateSuccess })
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

/**  Get one user library by library id */
const getUserLibrary = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            const { section, sort, author, bookId, star } = req.query as any
            const skip = req.query.skip || dataLimit.skip
            const limit = req.query.limit || dataLimit.limit
            /** Get current user */
            let userObj: any = Object.assign({}, req.user)
            if (bookId) {
                  const book = userObj?.library?.saved?.find(id => String(id) === bookId)
                  res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data: { library: userObj.library, saved: book ? true : false } })
                  return
            }
            if (section === 'saved' && userObj?.library?.saved?.length) {
                  const search: any = { _id: { $in: userObj.library.saved } }
                  if (author) { search.author = author }
                  if (star) { search.star = Number(star) }
                  const data = await bookService.getAllBookSummaries(0, 0, search, [['createdAt', sort || 'DESC']])
                  if (data.summaries?.length) {
                        data.summaries = userObj.library.saved.reverse().map(oi => {
                              return data.summaries.find(si => String(si._id) === String(oi))
                        }).filter(i => i)
                        if (sort) data.summaries = sortArrayObject(data.summaries, 'title', sort.toLowerCase())
                        data.summaries = data.summaries.slice(skip, skip + limit)
                  }
                  res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
                  return
            }
            if (section === 'completed' && userObj?.library?.completed?.length) {
                  const search: any = { _id: { $in: userObj.library.completed } }
                  if (author) { search.author = author }
                  if (star) { search.star = Number(star) }
                  const data = await bookService.getAllBookSummaries(0, 0, search, [['createdAt', sort || 'DESC']])
                  if (data.summaries?.length) {
                        data.summaries = userObj.library.completed.reverse().map(oi => {
                              return data.summaries.find(si => String(si._id) === String(oi))
                        }).filter(i => i)
                        if (sort) data.summaries = sortArrayObject(data.summaries, 'title', sort.toLowerCase())
                        data.summaries = data.summaries.slice(skip, skip + limit)
                  }
                  res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
                  return
            }
            if (
                  section === 'reading' &&
                  userObj?.library?.reading?.length
            ) {
                  /** collect user reads books ids those not in completed books list */
                  const bookIds = new Set()
                  userObj.library.reading.map(oneBook => {
                        if (
                              oneBook.bookId &&
                              !userObj.library?.completed?.find(cb => String(cb) === String(oneBook.bookId))
                        ) bookIds.add(oneBook.bookId)
                  })

                  /** Prepare query to get users reads book details */
                  const search: any = { _id: { $in: [...bookIds] } }
                  if (author) { search.author = author }

                  /** Get user reads books details by users reads books ids */
                  const data = await bookService.getAllBookSummaries(0, 0, search, [], true)

                  /** sort summary by latest reads based on user library readings */
                  const summaries = new Set()
                  userObj.library.reading.map(r => {
                        const summary = data.summaries.find((os: any) => String(os._id) === String(r.bookId))
                        if (!summary) return;
                        summary.reads = Number((r.chaptersCompleted && r.chaptersCompleted?.length ? (100 * r.chaptersCompleted?.length) / summary?.chapters?.length : 0).toFixed(0))
                        summary.updatedAt = r.updatedAt
                        delete summary.chapters
                        summaries.add(summary)
                  })
                  data.summaries = [...summaries]
                  if (sort) data.summaries = sortArrayObject(data.summaries, 'title', sort.toLowerCase())
                  else data.summaries = sortArrayObject(data.summaries, 'updatedAt', 'desc')
                  data.summaries = data.summaries.slice(skip, skip + limit)
                  res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
                  return
            }
            res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data: [] })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

const submitQuery = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            const { subject, message }: { subject: string, message: string } = req.body;
            const userObj = Object.assign({}, req.user)
            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.admin.customerInquiry })
            const sub = emailTemplateDetails.subject || 'Customer Inquiry'
            let html = `<p>Hello Admin,</p><p>You receive a support message from user.</p><p>Email : ${userObj.email}</p><p>Phone Number : ${userObj.contactNumber || ''}</p><p>Subject : ${subject}</p><p>Message : ${message}</p><p>Best regards,</p><p>${userObj.email.split('@')[0]}</p>`

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        username: userObj.email.split('@')[0],
                        email: userObj.email,
                        phone_number: userObj.contactNumber || '',
                        subject,
                        message
                  }
                  const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                  if (htmlData) {
                        html = htmlData
                  }
            }
            const result = await sentEmail(originEmails.contactUs, sub, html);
            if (!result) {
                  return next(Boom.badData(authControllerResponse.submitQueryError))
            }
            res.status(200).send({ message: authControllerResponse.submitQuerySuccess })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

const submitFeedback = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            const { title, feedback }: { title: string, feedback: string } = req.body;
            const userObj = Object.assign({}, req.user)
            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.admin.customerFeedback })
            const sub = emailTemplateDetails.subject || 'Customer Feedback'
            let html = `<p>You've received a feedback from ${userObj.email}.</p><p>Title : ${title}</p><p>Feedback : ${feedback}</p>`

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        email: userObj.email,
                        title,
                        feedback
                  }
                  const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                  if (htmlData) {
                        html = htmlData
                  }
            }
            const result = await sentEmail(originEmails.contactUs, sub, html);
            if (!result) {
                  return next(Boom.badData(authControllerResponse.submitQueryError))
            }
            res.status(200).send({ message: authControllerResponse.submitQuerySuccess })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

const updateRating = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            const { star, description, bookId }: { star: number, description: string, bookId: string } = req.body;
            const userObj = Object.assign({}, req.user)
            await ratingService.updateRating({ star, description, bookId, userId: userObj._id });
            res.status(200).send({ message: authControllerResponse.bookRatingSuccess })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/** Add User by referral */
const blessFriend = async (req: any, res: Response, next: NextFunction) => {
      try {
            const body = req.body
            body.email = body.friendEmail
            delete body.friendEmail
            const refUser: any = await usersService.getOneUserByFilter({ email: req.user.email })
            if (!refUser) {
                  return next(Boom.notFound(authControllerResponse.getReferralUserError))
            }
            /** Get user from db */
            const inviteUser: any = await usersService.getOneUserByFilter({ email: body.email })
            if (inviteUser) {
                  return next(Boom.conflict(authControllerResponse.userAlreadyExistError))
            }
            const subscriptionDetails = await subscriptionService.getOneSubscriptionByFilter({ _id: body.subscription })
            if (!subscriptionDetails) {
                  return next(Boom.notFound(authControllerResponse.blessFriendSubscriptionError))
            }
            const verificationCode = Math.floor(1000 + Math.random() * 9000)
            const token: string = getToken({ code: String(verificationCode), email: body.email })
            const link: string = `${origins[NODE_ENV]}/account/verify-user?token=${token}`

            const inviteUserBody: any = {
                  image: '',
                  email: body.email,
                  password: body.password,
                  type: 'User',
                  status: 'Deactive',
                  verified: false,
                  verificationCode,
                  subscription: subscriptionDetails._id,
                  referralUserId: refUser._id,
                  device: body.device || 'web'
            }
            let subscriptionEndDate;
            if (!body.inAppSubscription) {
                  const customer = await stripeSubscriptionService.createCustomer(body.email, req.body.token)
                  const subscription = await stripeSubscriptionService.createSubscription(subscriptionDetails.stripePlanId, customer.id, req.body.paymentMethod, 'active')
                  inviteUserBody.stripe = {
                        customerId: customer.id,
                        planId: subscriptionDetails.stripePlanId,
                        subscriptionId: subscription.id,
                        createdAt: new Date()
                  }
                  subscriptionEndDate = new Date(subscription.current_period_end * 1000)
                  if (subscription.status === 'trialing') {
                        let now = new Date(subscriptionEndDate)
                        switch (subscriptionDetails.duration) {
                              case "Year":
                                    subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 12));
                                    break;
                              case "Half Year":
                                    subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 6));
                                    break;
                              default:
                                    subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 1));
                                    break;
                        }
                  }
            } else {
                  inviteUserBody.inAppSubscription = { ...body.inAppSubscription, createdAt: new Date() }
                  inviteUserBody.inAppSubscriptionStatus = 'Active'
                  let now = new Date()
                  switch (subscriptionDetails.duration) {
                        case "Year":
                              subscriptionEndDate = new Date(now.setMonth(new Date().getMonth() + 12));
                              break;
                        case "Half Year":
                              subscriptionEndDate = new Date(now.setMonth(new Date().getMonth() + 6));
                              break;
                        default:
                              subscriptionEndDate = new Date(now.setMonth(new Date().getMonth() + 1));
                              break;
                  }
            }
            const invitedUserDetails = await authService.createUser(inviteUserBody)
            if (!invitedUserDetails || !invitedUserDetails._id) {
                  return next(Boom.notFound(authControllerResponse.createUserFailed))
            }
            /** Create transaction */
            inviteUserBody?.inAppSubscription && await transactionsService.createTransaction({
                  latestInvoice: '',
                  planCreatedAt: inviteUserBody?.inAppSubscription?.createdAt,
                  planExpiredAt: subscriptionEndDate,
                  userId: invitedUserDetails._id,
                  total: subscriptionDetails.price,
                  status: inviteUserBody.inAppSubscriptionStatus?.toLowerCase(),
                  paymentMethod: null,
                  reason: '',
                  paymentLink: '',
                  device: 'app'
            })
            const sendEmailTemplate = await emailTemplateService.getAllEmailTemplates(0, 0, { title: { $in: [emailTemplatesTitles.customer.sendInvitation, emailTemplatesTitles.customer.blessFriend] } }, [])
            const blessFriendTemplate = sendEmailTemplate.count && sendEmailTemplate.emailTemplates.find(oneTemplate => oneTemplate.title === emailTemplatesTitles.customer.blessFriend)
            const sendInvitationTemplate = sendEmailTemplate.count && sendEmailTemplate.emailTemplates.find(oneTemplate => oneTemplate.title === emailTemplatesTitles.customer.sendInvitation)

            const blessFriendSubject = blessFriendTemplate?.subject || 'Customer Registration Bless Friend'
            const sendInvitationSubject = sendInvitationTemplate?.subject || 'Send Invitation'

            let blessFriendHtml = `<p>Dear ${refUser.email.split('@')[0]},</p><p>Thank you for registered with Holy Reads.</p><p>Your customer account details are below:</p><p>Email : ${body.email}<br>Password: ${body.password}</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`
            let sentInvitationHtml = `<p>Dear ${body.email.split('@')[0]}</p><p>${refUser.email.split('@')[0]} invited you to connect on Holy Reads</p><p>Your customer account details are below:</p><p>Email : ${body.email}<br>Password: ${body.password}</p><p>Please click <a href=${link}>Here</a> to accept invite.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

            if (blessFriendTemplate && blessFriendTemplate.content) {
                  const contentData = { email: body.email, username: refUser.email.substr(0, refUser.email.indexOf('@')), plan: subscriptionDetails.duration + 'ly' }
                  const htmlData = await compileHtml(blessFriendTemplate.content, contentData)
                  if (htmlData) {
                        blessFriendHtml = htmlData
                  }
            }
            if (sendInvitationTemplate && sendInvitationTemplate.content) {
                  const contentData = { sendername: refUser.email.split('@')[0], link, email: body.email, password: body.password, plan: subscriptionDetails.duration + 'ly' }
                  const htmlData = await compileHtml(sendInvitationTemplate.content, contentData)
                  if (htmlData) {
                        sentInvitationHtml = htmlData
                  }
            }
            const blessFriendEmailResult = await sentEmail(refUser.email, blessFriendSubject, blessFriendHtml);
            const sendInvitationResult = await sentEmail(body.email, sendInvitationSubject, sentInvitationHtml);
            if (!blessFriendEmailResult || !sendInvitationResult) {
                  return next(Boom.badData(authControllerResponse.sentVerifyEmailFailure))
            }

            await notificationsService.createNotification({ userId: invitedUserDetails._id, type: 'setting', notification: { title: 'Holy Reads Invitation 🎁', description: refUser.email.split('@')[0] + ' invited to you ✨' } })
            fetchNotifications(io.sockets, { _id: invitedUserDetails._id })

            if (!inviteUserBody?.inAppSubscription) {
                  return res.status(200).send({ message: authControllerResponse.blessFriendSuccess })  
            }

            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.chooseSubscription })
            const sub = emailTemplateDetails.subject || 'Subscription'
            let html = `<p>Dear ${body.email.split('@')[0]},</p><p>You have subscribed to ${subscriptionDetails.title} Plan for ${subscriptionDetails.duration} days on ${subscriptionDetails.title} basis.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const localeDate = subscriptionEndDate?.toLocaleDateString()?.split('/')
                  const contentData = {
                        username: body.email.split('@')[0],
                        price: subscriptionDetails.price,
                        endDate: `[${localeDate[0]?.padStart(2, '0')}/${localeDate[1]?.padStart(2, '0')}/${localeDate[2]?.slice(-2)}]`,
                        duration: subscriptionDetails?.duration?.toLowerCase()?.includes('half') ? subscriptionDetails.duration : `1 ${subscriptionDetails.duration}`
                  }
                  const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                  if (htmlData) {
                        html = htmlData
                  }
            }
            const result = await sentEmail(body.email, sub, html);
            if (!result) {
                  return next(Boom.badData(authControllerResponse.sentSubscriptionEmailFilure))
            }

            res.status(200).send({ message: authControllerResponse.blessFriendSuccess })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/** subscribe plan */
const subscribePlan = async (req: any, res: Response, next: NextFunction) => {
      try {
            const userObj = req.user
            const subscriptionDetails = await subscriptionService.getOneSubscriptionByFilter({ _id: req.body.subscription })
            if (!subscriptionDetails) {
                  return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
            }
            let body: any = {};
            let subscription;
            let subscriptionEndDate;
            if (req.body.inAppSubscription) {
                  body = {
                        subscription: req.body.subscription,
                        inAppSubscription: { ...req.body.inAppSubscription, createdAt: new Date() },
                        inAppSubscriptionStatus: 'Active',
                  }
                  let now = new Date()
                  switch (subscriptionDetails.duration) {
                        case "Year":
                              subscriptionEndDate = new Date(now.setMonth(new Date().getMonth() + 12));
                              break;
                        case "Half Year":
                              subscriptionEndDate = new Date(now.setMonth(new Date().getMonth() + 6));
                              break;
                        default:
                              subscriptionEndDate = new Date(now.setMonth(new Date().getMonth() + 1));
                              break;
                  }
            } else {
                  if (!userObj?.stripe?.customerId) {
                        const customer = await stripeSubscriptionService.createCustomer(userObj.email, req.body.token)
                        if (!userObj.stripe) { userObj.stripe = {} }
                        userObj.stripe.customerId = customer.id
                        await usersService.updateUser({ _id: userObj._id }, { 'stripe.customerId': customer.id })
                  }
                  if (!userObj?.stripe?.subscriptionId) {
                        subscription = await stripeSubscriptionService.createSubscription(subscriptionDetails.stripePlanId, userObj.stripe.customerId, req.body.paymentMethod)
                        subscriptionEndDate = new Date(subscription.current_period_end * 1000)
                  } else {
                        await stripeSubscriptionService.updateSubscription(subscriptionDetails.stripePlanId, userObj.stripe.subscriptionId, userObj.stripe.customerId, req.body.paymentMethod)
                        subscription = await stripeSubscriptionService.retrieveSubscription(userObj.stripe.subscriptionId)
                        subscriptionEndDate = new Date(subscription.current_period_end * 1000)
                  }
                  if (subscription.status === 'trialing') {
                        let now = new Date(subscriptionEndDate)
                        switch (subscriptionDetails.duration) {
                              case "Year":
                                    subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 12));
                                    break;
                              case "Half Year":
                                    subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 6));
                                    break;
                              default:
                                    subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 1));
                                    break;
                        }
                  }
                  /** add stripe details into body */
                  body = {
                        'stripe.planId': subscriptionDetails.stripePlanId,
                        'stripe.subscriptionId': subscription.id,
                        'stripe.createdAt': new Date(),
                        subscription: subscriptionDetails._id
                  }

            }
            await usersService.updateUser({ _id: userObj._id }, body)

            /** Create transaction */
            req.body?.inAppSubscription && await transactionsService.createTransaction({
                  latestInvoice: '',
                  planCreatedAt: userObj?.inAppSubscription?.createdAt,
                  planExpiredAt: subscriptionEndDate,
                  userId: userObj._id,
                  total: subscriptionDetails.price,
                  status: body.inAppSubscriptionStatus?.toLowerCase(),
                  paymentMethod: null,
                  reason: '',
                  paymentLink: '',
                  device: 'app'
            })
            if (!req.body?.inAppSubscription) {
                  return res.status(200).send({
                        message: subscriptionsControllerResponse.createSubscriptionSuccess,
                        data:  {
                              subscriptionStatus: subscription.status,
                              customerEmail: userObj.email
                        }
                  })
            }

            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.chooseSubscription })
            const sub = emailTemplateDetails.subject || 'Holyreads Subscription'
            let html = `<p>Dear ${userObj.email.split('@')[0]},</p><p>You have subscribed to ${subscriptionDetails.title} Plan for ${subscriptionDetails.duration} days on ${subscriptionDetails.title} basis.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const localeDate = subscriptionEndDate?.toLocaleDateString()?.split('/')
                  const contentData = {
                        username: userObj.email.split('@')[0],
                        price: subscriptionDetails.price,
                        endDate: `[${localeDate[0]?.padStart(2, '0')}/${localeDate[1]?.padStart(2, '0')}/${localeDate[2]?.slice(-2)}]`,
                        duration: subscriptionDetails?.duration?.toLowerCase()?.includes('half') ? subscriptionDetails.duration : `1 ${subscriptionDetails.duration}`
                  }
                  const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                  if (htmlData) {
                        html = htmlData
                  }
            }
            const notificationTitle = 'Holyreads Subscription'
            const notificationDescription = 'Holyreads subscription has been activated! 🎉'
            await notificationsService.createNotification({ userId: userObj._id, type: 'setting', notification: { title: notificationTitle, description: notificationDescription } })
            fetchNotifications(io.sockets, { _id: userObj._id })

            const result = await sentEmail(userObj.email, sub, html);
            if (!result) {
                  return next(Boom.badData(authControllerResponse.sentSubscriptionEmailFilure))
            }

            res.status(200).send({
                  message: subscriptionsControllerResponse.createSubscriptionSuccess,
                  data: !req.body?.inAppSubscription ? {
                        subscriptionStatus: subscription.status,
                        customerEmail: userObj.email
                  } : { subscription: subscriptionDetails._id }
            })

            /** Push notification */
            if (req.user.pushTokens.length && userObj?.notification?.push && userObj?.notification?.subscription) {
                  const tokens = req.user.pushTokens.map(i => i.token)
                  pushNotification(tokens, notificationTitle, notificationDescription)
            }
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/** Remove User */
const deleteUser = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            const userObj: any = req.user
            await usersService.deleteUser(userObj._id)
            res.status(200).send({ message: authControllerResponse.deleteUserSuccess })
            if (userObj && userObj.image) {
                  await removeS3File(userObj.image, s3Bucket)
            }
            if (userObj?.stripe?.subscriptionId) {
                  await stripeSubscriptionService.cancelSubscription(userObj.stripe.subscriptionId)
            }
            /** Delete user notifications */
            const deleteNotifications = notificationsService.deleteNotifications({ userId: userObj._id })
            /** Delete user books ratings */
            const deleteRatings = ratingService.deleteRatings({ userId: userObj._id })
            const deleteHighlights = highLightsService.deleteHighLights({ userId: userObj._id })
            await Promise.all([deleteNotifications, deleteRatings, deleteHighlights])
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

export {
      getUserAccount,
      getBlessFriend,
      getShareOptionImageUrl,
      changePassword,
      getUserSubscription,
      updateUserAccount,
      updateUserLibrary,
      getUserLibrary,
      submitQuery,
      submitFeedback,
      blessFriend,
      subscribePlan,
      updateRating,
      deleteUser,
      emailAuth,
      verifyEmailAuth
}
