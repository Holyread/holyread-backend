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
import { removeImageToAwsS3, uploadImageToAwsS3, encrypt, compileHtml, sentEmail, pushNotification } from '../../lib/utils/utils'
import { awsBucket, emailTemplatesTitles, originEmails } from '../../constants/app.constant'
import config from '../../../config'

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
            delete userObj.password
            delete userObj.library
            delete userObj.smallGroups
            delete userObj.verificationCode
            delete userObj.oAuth
            delete userObj.stripeChargeId
            const notifications = await notificationsService.getUserNotifications({ userId: userObj._id })
            userObj.notifications = notifications
            res.status(200).send({ message: authControllerResponse.getUserSuccess, data: userObj })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

const changePassword = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            const { password, newPassword }: { password: string, newPassword: string } = req.body;
            const userObj = Object.assign({}, req.user)
            if (userObj?.password !== encrypt(password)) {
                  return next(Boom.notFound(authControllerResponse.userInvalidPasswordError))
            }
            await usersService.updateUser({ password: newPassword }, { _id: userObj._id })
            const notificationTitle = 'Change Password'
            const notificationDescription = 'Password Changed Successfully'
            await notificationsService.createNotification({ userId: userObj._id, type: 'setting', notification: { title: notificationTitle, description: notificationDescription }})
            fetchNotifications(io.sockets, { _id: userObj._id })
            res.status(200).send({ message: authControllerResponse.passwordUpdateSuccess })
            /** Push notification */
            if (userObj?.pushTokens?.length && userObj.pushNotification) {
                  const tokens = userObj.pushTokens.map(i => i.token)
                  pushNotification(tokens, notificationTitle, notificationDescription)
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
            if (data.subscriptions) {
                  try {
                        data.subscriptions = await subscriptionService.getOneSubscriptionByFilter({ _id: data.subscriptions })
                  } catch (error) {
                        /** Handle get subscription error here */
                  }
            }
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
                  pushNotification: (typeof req.body.pushNotification === 'boolean') ? req.body.pushNotification : userObj.pushNotification || false,
                  emailNotification: (typeof req.body.emailNotification === 'boolean') ? req.body.emailNotification : userObj.emailNotification || false,
            }
  
            if (req.body.kindleEmail) {
                  body.kindleEmail = req.body.kindleEmail
            }
            if (req.body.image === null) {
                  await removeImageToAwsS3(userObj.image, s3Bucket)
            }
            if (req.body.image && req.body.image.includes('base64')) {
                  await removeImageToAwsS3(userObj.image, s3Bucket)
                  body.image = await uploadImageToAwsS3(req.body.image, 'profile', s3Bucket)
            }
            if (req.body.image && req.body.image.startsWith('http')) {
                  body.image = userObj.image
            }
            if (req.body.pushTokens && req.body.pushTokens.deviceId && req.body.pushTokens.token) {
                  body.pushTokens = req.user.pushTokens || []
                  const pushNotifcationIndex = body.pushTokens.findIndex(item => item.deviceId === req.body.pushTokens.deviceId)
                  if (pushNotifcationIndex > -1) {
                        body.pushTokens[pushNotifcationIndex].token = req.body.pushTokens.token
                  } else {
                        body.pushTokens.push({ deviceId: req.body.pushTokens.deviceId, token: req.body.pushTokens.token })
                  }
            }
            await usersService.updateUser(body, { _id: userObj._id })
            if (req.body.kindleEmail) {
                  const title = userObj.kindleEmail ? 'Update Kindle Email' : 'Add Kindle Email'
                  const description = userObj.kindleEmail ? 'Kindle email updated' : 'Kindle email Added'
                  await notificationsService.createNotification({ userId: userObj._id, type: 'setting', notification: { title, description }})
                  fetchNotifications(io.sockets, { _id: userObj._id })
                  /** Push notification */
                  if (userObj.pushTokens.length && userObj.pushNotification) {
                        const tokens = userObj.pushTokens.map(i => i.token)
                        pushNotification(tokens, title, description)
                  }
            }
            return res.status(200).send({ message: authControllerResponse.userUpdateSuccess })
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

/** get share option image url */
const getShareOptionImageUrl = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            if (req.body.image) {
                  req.body.image = await uploadImageToAwsS3(req.body.image, 'share-image', { ...s3Bucket, documentDirectory: 'users/share-options' })
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
                  req.body['$pull'] = { 'library.reading': { bookId: { '$in': [req.body.completed] } } }
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
                  const readingObj = userObj.library?.reading?.find(oneRead => oneRead.bookId === req.body.bookId)
                  if (!readingObj) {
                        if (!userObj.library?.reading) {
                              userObj.library.reading = []
                        }
                        userObj.library.reading.push({
                              bookId: req.body.bookId,
                              chaptersCompleted: [req.body.chapter],
                              updatedAt: new Date()
                        })
                        await usersService.updateUser({ library: userObj.library }, query)
                        return res.status(200).send({ message: authControllerResponse.userUpdateSuccess })
                  }
                  req.body['$addToSet'] = { 'library.reading.$.chaptersCompleted': req.body.chapter }
                  req.body['$set'] = { 'library.reading.$.updatedAt': new Date() }
                  query['library.reading.bookId'] = req.body.bookId
                  delete req.body.bookId
                  delete req.body.chapter
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
            await usersService.updateUser(req.body, query)
            return res.status(200).send({ message: authControllerResponse.userUpdateSuccess })
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

/**  Get one user library by library id */
const getUserLibrary = async (req: Request | any, res: Response, next: NextFunction) => {
      try {
            const { section, sort, author, bookId } = req.query as any
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
                  const data = await bookService.getAllBookSummaries(0, 0, search, [['createdAt', sort || 'DESC']])
                  if (data.summaries?.length) {
                        data.summaries = userObj.library.saved.reverse().map(oi => {
                              return data.summaries.find(si => String(si._id) === String(oi))
                        }).filter(i => i)
                  }
                  res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
                  return
            }
            if (section === 'completed' && userObj?.library?.completed?.length) {
                  const search: any = { _id: { $in: userObj.library.completed } }
                  if (author) { search.author = author }
                  const data = await bookService.getAllBookSummaries(0, 0, search, [['createdAt', sort || 'DESC']])
                  if (data.summaries?.length) {
                        data.summaries = userObj.library.completed.reverse().map(oi => {
                              return data.summaries.find(si => String(si._id) === String(oi))
                        }).filter(i => i)
                  }
                  res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
                  return
            }
            if (
                  section === 'reading' &&
                  userObj?.library?.reading?.length
            ) {
                  /** Sort user reads books by reads _id */
                  userObj.library.reading = userObj.library.reading.sort((a, b) => (String(a._id) > String(b._id)) ? -1 : ((String(b._id) > String(a._id)) ? 1 : 0))

                  /** collect user reads books ids those not in completed books list */
                  const bookIds = userObj.library.reading.map(oneBook => {
                        if (
                              oneBook.bookId &&
                              !userObj.library?.completed?.find(cb => String(cb) === String(oneBook.bookId))
                        ) {
                              return oneBook.bookId
                        }
                  }).filter(b => b)

                  /** Prepare query to get users reads book details */
                  const search: any = { _id: { $in: bookIds } }
                  if (author) { search.author = author }

                  /** Get user reads books details by users reads books ids */
                  const data = await bookService.getAllBookSummaries(0, 0, search, [['createdAt', sort || 'DESC']], true)

                  /** sort summary by latest reads based on user library readings */
                  data.summaries = userObj.library.reading.map(r => {
                        const summary = data.summaries.find((os: any) => String(os._id) === String(r.bookId))
                        if (summary) {
                              summary.reads = Number((r.chaptersCompleted && r.chaptersCompleted?.length ? (100 * r.chaptersCompleted?.length) / summary?.chapters?.length : 0).toFixed(0))
                              summary.updatedAt = r.updatedAt
                              delete summary.chapters
                              return summary
                        }
                  }).filter(s => s).sort((a, b) =>
                        (new Date(a.updatedAt).getTime() > new Date(b.updatedAt).getTime())
                              ? -1
                              : ((new Date(b.updatedAt).getTime() > new Date(a.updatedAt).getTime()) ? 1 : 0))

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
            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.contactUs })
            const sub = emailTemplateDetails.subject || 'Contact Us'
            let html = `<p>Hello Admin,</p><p>You receive a support message from user.</p><p>Email : ${userObj.email}</p><p>Phone Number : ${userObj.contactNumber || ''}</p><p>Subject : ${subject}</p><p>Message : ${message}</p><p>Best regards,</p><p>${userObj.firstName} ${userObj.lastName}</p>`

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        username: userObj.firstName + ' ' + userObj.lastName,
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
            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.feedback })
            const sub = emailTemplateDetails.subject || 'Client Feedback'
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

/** Add User by referral */
const blessFriend = async (req: any, res: Response, next: NextFunction) => {
      try {
            const body = req.body
            body.email = body.friendEmail
            delete body.friendEmail
            const refUser: any = await usersService.getOneUserByFilter({ email: req.user.email })
            if (!refUser) {
                  return next(Boom.badData(authControllerResponse.getReferralUserError))
            }
            /** Get user from db */
            const inviteUser: any = await usersService.getOneUserByFilter({ email: body.email })
            if (inviteUser) {
                  return next(Boom.badData(authControllerResponse.userAlreadyExistError))
            }
            const sendEmailTemplate = await emailTemplateService.getAllEmailTemplates(0, 0, { title: { $in: [emailTemplatesTitles.customer.sendInvitation, emailTemplatesTitles.customer.blessFriend] } }, [])
            const blessFriendTemplate = sendEmailTemplate.count && sendEmailTemplate.emailTemplates.find(oneTemplate => oneTemplate.title === emailTemplatesTitles.customer.blessFriend)
            const sendInvitationTemplate = sendEmailTemplate.count && sendEmailTemplate.emailTemplates.find(oneTemplate => oneTemplate.title === emailTemplatesTitles.customer.sendInvitation)

            const blessFriendSubject = blessFriendTemplate?.subject || 'Customer Registration Bless Friend'
            const sendInvitationSubject = sendInvitationTemplate?.subject || 'Send Invitation'

            let blessFriendHtml = `<p>Dear {{username}},</p><p>Thank you for registered with Holyread.</p><p>Your customer account details are below:</p><p>Email : {{email}}<br>Password: {{password}}</p><p>Should you have any queries or if any of your details change, please contact us.</p><p>Best regards,<br>Holyread</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`
            let sentInvitationHtml = '<p>Dear {{username}}</p><p>You have been registered on Holyread.</p><p>Your customer account details are below:</p><p>Email : {{email}}<br>Password: {{password}}</p><p>Should you have any queries or if any of your details change, please contact us.</p><p>Best regards,<br>Holyread</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>'

            if (blessFriendTemplate && blessFriendTemplate.content) {
                  const contentData = { email: body.email, password: body.password, username: refUser.email.substr(0, body.email.indexOf('@')) }
                  const htmlData = await compileHtml(blessFriendTemplate.content, contentData)
                  if (htmlData) {
                        blessFriendHtml = htmlData
                  }
            }
            if (blessFriendTemplate && blessFriendTemplate.content) {
                  const contentData = { email: body.email, password: body.password, username: body.email.substr(0, body.email.indexOf('@')) }
                  const htmlData = await compileHtml(blessFriendTemplate.content, contentData)
                  if (htmlData) {
                        blessFriendHtml = htmlData
                  }
            }
            if (sendInvitationTemplate && sendInvitationTemplate.content) {
                  const contentData = { email: body.email, password: body.password, username: refUser.email.substr(0, body.email.indexOf('@')) }
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
            const subscriptionDetails = await subscriptionService.getOneSubscriptionByFilter({ _id: body.subscriptions })
            if (!subscriptionDetails) {
                  return next(Boom.badData(authControllerResponse.blessFriendSubscriptionError))
            }
            const invitedUserDetails = await authService.createUser({
                  image: '',
                  email: body.email,
                  password: body.password,
                  type: 'User',
                  status: 'Active',
                  verified: true,
                  verificationCode: '',
                  subscriptions: subscriptionDetails._id,
                  referralUserId: refUser._id
            })
            if (!invitedUserDetails || !invitedUserDetails._id) {
                  return next(Boom.badData(authControllerResponse.createUserFailed))
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
            if (!userObj.stripeCustomerId) {
                  const customer = await stripeSubscriptionService.createCustomer(userObj.email, req.body.token)
                  userObj.stripeCustomerId = customer.id
                  await usersService.updateUser({ stripeCustomerId: customer.id }, { _id: userObj._id })
            }
            const sbscription = await stripeSubscriptionService.createSubscription(subscriptionDetails.stripePlanId, userObj.stripeCustomerId)
            await usersService.updateUser(
                  {
                        stripePlanId: subscriptionDetails.stripePlanId,
                        stripeSubscriptionId: sbscription.id,
                        subscriptions: subscriptionDetails._id
                  },
                  { _id: userObj._id }
            )
            const emailTemplateDetails = await emailTemplateService.getOneEmailTemplateByFilter({ title: emailTemplatesTitles.customer.chooseSubscription })
            const sub = emailTemplateDetails.subject || 'Subscription'
            let html = `<p>Dear ${userObj.email.split('@')[0]},</p><p>You have subscribed to ${subscriptionDetails.title} Plan for ${subscriptionDetails.duration} days on ${subscriptionDetails.title} basis.</p><p>Should you have any queries or if any of your details change, please contact us.</p><p>Best regards,<br>Holyread</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        username: userObj.email.split('@')[0],
                        subscription_title: subscriptionDetails.title,
                        subscription_details: subscriptionDetails.duration,
                        subscription_duration: subscriptionDetails.title
                  }
                  const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                  if (htmlData) {
                        html = htmlData
                  }
            }
            const notificationTitle = 'Update Subscription'
            const notificationDescription = 'Subscription updated successfully'
            await notificationsService.createNotification({ userId: userObj._id, type: 'setting', notification: { title: notificationTitle, description: notificationDescription }})
            fetchNotifications(io.sockets, { _id: userObj._id })

            const result = await sentEmail(userObj.email, sub, html);
            if (!result) {
                  return next(Boom.notFound(authControllerResponse.sentSubscriptionEmailFilure))
            }
            res.status(200).send({
                  message: subscriptionsControllerResponse.createSubscriptionSuccess,
                  data: {
                        clientSecret: sbscription.latest_invoice.payment_intent.client_secret,
                        customerEmail: userObj.email
                  }
            })
            /** Push notification */
            if (req.user.pushTokens.length && userObj.pushNotification) {
                  const tokens = req.user.pushTokens.map(i => i.token)
                  pushNotification(tokens, notificationTitle, notificationDescription)
            }
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

export {
      getUserAccount,
      getShareOptionImageUrl,
      changePassword,
      getUserSubscription,
      updateUserAccount,
      updateUserLibrary,
      getUserLibrary,
      submitQuery,
      submitFeedback,
      blessFriend,
      subscribePlan
}
