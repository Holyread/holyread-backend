import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import { trailDays } from '../../constants/app.constant';
import { Types } from 'mongoose'

import {
      encrypt,
      decrypt,
      getToken,
      sentEmail,
      compileHtml,
      getTimeDiff,
      verifyToken,
      removeS3File,
      formattedDate,
      uploadFileToS3,
      sortArrayObject,
      pushNotification,
      imageUrlToBase64,
      capitalizeFirstLetter,
      validateEmail,
} from '../../lib/utils/utils'

import {
      origins,
      dataLimit,
      awsBucket,
      originEmails,
      emailTemplatesTitles,
} from '../../constants/app.constant'

import { io } from '../../app';

import { responseMessage }
      from '../../constants/message.constant'
import { fetchNotifications }
      from '../../controllers/customers/notification.controller'

import config
      from '../../../config'
import authService
      from '../../services/admin/users/user.service'
import userService
      from '../../services/customers/users/user.service';
import usersService
      from '../../services/customers/users/user.service';
import ratingService
      from '../../services/customers/book/rating.service';

import stripeSubscriptionService
      from '../../services/stripe/subscription';

import bookService
      from '../../services/customers/book/bookSummary.service';
import handoutsService
      from '../../services/customers/smallGroup/handouts.service';
import transactionsService
      from '../../services/customers/users/transactions.service';
import highLightsService
      from '../../services/customers/highLights/highLights.service';
import smallGroupService
      from '../../services/customers/smallGroup/smallGroup.service';
import subscriptionService
      from '../../services/admin/subscriptions/subscriptions.service';
import emailTemplateService
      from '../../services/admin/emailTemplate/emailTemplate.service';
import notificationsService
      from '../../services/customers/notifications/notifications.service';

import mailchimpService from '../../services/mailchimp'

const NODE_ENV = config.NODE_ENV

const authControllerResponse
      = responseMessage.authControllerResponse
const couponControllerResponse
      = responseMessage.couponsControllerResponse
const handoutsControllerResponse
      = responseMessage.handoutsControllerResponse
const smallGroupControllerResponse
      = responseMessage.smallGroupControllerResponse
const bookSummaryControllerResponse
      = responseMessage.bookSummaryControllerResponse
const subscriptionsControllerResponse
      = responseMessage.subscriptionsControllerResponse

const s3Bucket = {
      region: awsBucket.region,
      bucketName: awsBucket[NODE_ENV].bucketName,
      documentDirectory: `${awsBucket.usersDirectory}`,
}

/**  Get one user by id */
const getUserAccount = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            /** Get current user */
            let userObj: any = Object.assign({}, req.user)

            userObj?.oAuth.length === 1 ? userObj.loginType = userObj.oAuth[0]?.provider : userObj.loginType = 'NORMAL'

            if (userObj.image) {
                  userObj.image
                        = `${awsBucket[NODE_ENV].s3BaseURL}/users/${userObj.image}`
            }
            userObj.isEmailLinked = !!userObj.password

            let subscriptionDetails
                  = await subscriptionService
                        .getOneSubscriptionByFilter({
                              _id: userObj.subscription
                        })

            /** set default subscription end date with 10 days trial */
            let subscriptionEndDate
                  = new Date(userObj.createdAt)
                        .getTime() + (trailDays * 24 * 60 * 60 * 1000);

            if (subscriptionDetails?._id) {
                  let months
                        = subscriptionDetails.duration === 'Month'
                              ? 1 : subscriptionDetails.duration === 'Half Year'
                                    ? 6 : 12;

                  const createdAt
                        = userObj?.stripe?.createdAt
                        || userObj?.inAppSubscription?.createdAt
                        || new Date();

                  subscriptionEndDate
                        = new Date(createdAt).setMonth(
                              new Date(createdAt).getMonth() + months
                        )
            }

            userObj.subscriptionEndsIn
                  = getTimeDiff(
                        String(new Date()),
                        String(new Date(subscriptionEndDate))
                  )

            delete userObj.password
            delete userObj.smallGroups
            delete userObj.verificationCode
            delete userObj.stripe

            const notifications
                  = await notificationsService
                        .getUserNotifications({ userId: userObj._id })

            userObj.notifications = notifications
            res.status(200).send({
                  message: authControllerResponse.getUserSuccess,
                  data: userObj
            })

            if (!userObj.libraries) {
                  const libraries = await userService
                        .createUserLibrary({
                              saved: [],
                              completed: [],
                              view: [],
                              smallGroups: [],
                              reading: [],
                        })

                  userObj.libraries = libraries?._id
            }
            await userService.updateUser(
                  { _id: userObj._id },
                  {
                        lastSeen: new Date(),
                        libraries: userObj.libraries
                  }
            );
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/**  Get one user by id */
const getBlessFriend = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            /** Validate Email */
            const isValid = await validateEmail(req.params.email);
            if (!isValid) {
                  return next(Boom.notFound(authControllerResponse.inValidEmailError));
            }

            /** Get current user */
            let userObj: any
                  = await usersService
                        .getOneUserByFilter({ email: req.params.email })

            res.status(200).send({
                  message: authControllerResponse.getUserSuccess,
                  data: { email: userObj?.email || null }
            })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

const getChangePasswordCode = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const userObj = Object.assign({}, req.user)
            const emailTemplateDetails
                  = await emailTemplateService
                        .getOneEmailTemplateByFilter({
                              title: emailTemplatesTitles.customer.forgotPassword
                        })
            const verificationCode = Math.floor(1000 + Math.random() * 9000)
            const subject = 'Change Password Verification'
            let html = `
                  <p>Dear ${userObj.email.split('@')[0]},</p>
                  <p>
                        You have requested a password change on Holy Read.
                        Please enter this code ${verificationCode} to
                        finish verification step
                  </p>
                  <p>
                        Should you have any questions or
                        if any of your details change,
                        please contact us.
                  </p>
                  <p>
                        Best regards,<br>Holy Reads
                  </p>
                  <p>
                        <strong>
                              ( ***&nbsp; Please do not reply to this email ***&nbsp; )
                        </strong>
                  </p>
            `

            if (
                  emailTemplateDetails &&
                  emailTemplateDetails.content
            ) {
                  const contentData = {
                        username: userObj.email.split('@')[0],
                        otp: verificationCode
                  }
                  const htmlData
                        = await compileHtml(
                              emailTemplateDetails.content,
                              contentData
                        )
                  if (htmlData) {
                        html = htmlData
                  }
            }

            await sentEmail({
                  from: originEmails.marketing,
                  to: userObj.email,
                  subject,
                  html
            });

            await usersService.updateUser(
                  { _id: userObj._id },
                  {
                        'codes.changePassword': {
                              code: verificationCode,
                              expiredIn: new Date(
                                    new Date()
                                          .setMinutes(new Date().getMinutes() + 5)
                              )
                        }
                  }
            )
            res.status(200).send({
                  message: authControllerResponse.chnagePasswordRequest
            })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

const changePassword = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const {
                  code,
                  password,
                  newPassword,
            }: {
                  code: number,
                  password: string,
                  newPassword: string,
            } = req.body;

            const userObj = Object.assign({}, req.user)
            if (
                  !password
                  ||
                  (
                        newPassword &&
                        userObj?.password !== encrypt(password || '')
                  )
            ) {
                  return next(
                        Boom.badData(
                              authControllerResponse.userInvalidPasswordError
                        )
                  )
            }
            if (
                  (
                        !newPassword &&
                        userObj?.password === encrypt(password || '')
                  )
                  ||
                  (
                        newPassword &&
                        userObj?.password === encrypt(newPassword || '')
                  )
            ) {
                  return next(
                        Boom.badData(authControllerResponse.userSamePasswordError)
                  )
            }
            if (
                  !userObj?.codes?.changePassword?.code
                  ||
                  userObj?.codes?.changePassword?.code !== code
            ) {
                  return next(
                        Boom.notAcceptable(authControllerResponse.invalidCodeError)
                  )
            }
            if (
                  new Date(userObj?.codes?.changePassword?.expiredIn).getTime()
                  <
                  new Date().getTime()
            ) {
                  return next(
                        Boom.resourceGone(authControllerResponse.codeExpiredError)
                  )
            }

            await usersService.updateUser(
                  { _id: userObj._id },
                  {
                        password: newPassword || password,
                        $unset: {
                              'codes.changePassword': 1
                        }
                  }
            )
            const notificationTitle = 'Change Password'
            const notificationDescription = 'Password Changed Successfully'

            await notificationsService.createNotification(
                  {
                        userId: userObj._id,
                        type: 'setting',
                        notification: {
                              title: notificationTitle,
                              description: notificationDescription
                        }
                  }
            )

            fetchNotifications(io.sockets, { _id: userObj._id })

            const emailTemplateDetails
                  = await emailTemplateService
                        .getOneEmailTemplateByFilter({
                              title: emailTemplatesTitles.customer.changePassword
                        })

            const subject = emailTemplateDetails.subject || 'Holy Reads Password Changed'
            let html = `
                  <p>
                        Dear ${userObj.email.split('@')[0]},
                  </p>
                  <p>
                        You have requested a password change on Holy Reads that succeed.
                  </p>
                  <p>
                        Should you have any questions or if any of your details change, please contact us.
                  </p>
                  <p>
                        Best regards,<br>Holy Reads
                  </p>
                  <p>
                        <strong>
                              ( ***&nbsp; Please do not reply to this email ***&nbsp; )
                        </strong>
                  </p>
            `

            if (
                  emailTemplateDetails &&
                  emailTemplateDetails.content
            ) {
                  const contentData = {
                        username: userObj.email.split('@')[0],
                  }
                  const htmlData
                        = await compileHtml(
                              emailTemplateDetails.content,
                              contentData
                        )
                  if (htmlData) {
                        html = htmlData
                  }
            }

            await sentEmail({
                  from: originEmails.marketing,
                  to: userObj.email,
                  subject,
                  html
            });
            res.status(200).send({
                  message: authControllerResponse.passwordUpdateSuccess
            })
            /** Push notification */
            if (
                  userObj?.pushTokens?.length &&
                  userObj?.notification?.push
            ) {
                  const tokens = userObj.pushTokens.map(i => i.token)
                  pushNotification(
                        tokens,
                        notificationTitle,
                        notificationDescription
                  )
            }
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

const emailAuth = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
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
            const subject = emailTemplateDetails.subject || 'Customer Email Auth Verification'
            let html = `<p>Dear ${email.split('@')[0]},</p><p>you requested for email auth.</p><p>Please enter this code ${verificationCode} <!-- <a href="${link}">Here</a> --> to verify your new email auth.</p><p>Should you have any questions or if any of your details change, please contact us.</p><p>Best regards,<br>Holy Reads</p><p><strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong></p>`

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        link,
                        code: verificationCode,
                        username: email.split('@')[0],
                  }
                  const htmlData = await compileHtml(emailTemplateDetails.content, contentData)
                  if (htmlData) {
                        html = htmlData
                  }
            }

            const result = await sentEmail({
                  from: originEmails.marketing,
                  to: email,
                  subject,
                  html
            });
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
const verifyEmailAuth = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const token = req?.query?.token as string

            if (!token && !req?.body?.code) {
                  /** Return status 406 not acceptable */
                  return next(
                        Boom.notAcceptable(
                              authControllerResponse.invalidCodeOrTokenError
                        )
                  )
            }

            if (
                  !token &&
                  req?.body?.code &&
                  (
                        !req?.body?.email
                        ||
                        !req?.body?.password
                  )
            ) {
                  /** Return status 406 not acceptable */
                  return next(
                        Boom.notAcceptable(
                              authControllerResponse.missingEmailOrPasswordError
                        )
                  )
            }

            const decryptToken: any = token && verifyToken(token)

            if (token && !decryptToken._id) {
                  /** Return status 406 not acceptable */
                  return next(
                        Boom.notAcceptable(
                              authControllerResponse.invalidCodeOrTokenError
                        )
                  )
            }

            const _id = token
                  ? decryptToken._id : req.user._id
            const code = token
                  ? decryptToken.code : req.body.code
            const email = token
                  ? decryptToken.email : req.body.email
            const password = token
                  ? decrypt(decryptToken.password) : req.body.password

            const existingEmailUser = await userService.getOneUserByFilter({
                  email,
                  _id: { $ne: _id }
            })

            if (existingEmailUser) {
                  /** Return status 409 conflict */
                  return next(
                        Boom.conflict(
                              authControllerResponse.emailAlreadyUsedError
                        )
                  )
            }

            /** Get user from db */
            const user: any
                  = await usersService
                        .getOneUserByFilter({
                              verificationCode: code, _id
                        })

            if (!user) {
                  /** Return status 404 not found */
                  return next(
                        Boom.notFound(
                              authControllerResponse.getUserError
                        )
                  )
            }

            await usersService.updateUser({ _id: user._id }, {
                  verified: true,
                  status: 'Active',
                  $unset: { verificationCode: 1 },
                  email,
                  password: password
            })
            if (user.email !== email) {
                  mailchimpService.updateUser(user.email, 'unsubscribed')
            }
            mailchimpService.updateUser(email, 'subscribed');
            const emailTemplateDetails = await emailTemplateService
                  .getOneEmailTemplateByFilter({
                        title: emailTemplatesTitles.customer.emailAuthEnabled
                  })

            const subject = emailTemplateDetails.subject
                  || 'Customer Email Auth Enabled'

            let html = `
                  <p>
                        Dear ${email.split('@')[0]},
                  </p>
                  <p>
                        you requested for email auth that succeed.
                  </p>
                  <p>
                        Should you have any questions or if any of your details change, please contact us.
                  </p>
                  <p>
                        Best regards,<br>Holy Reads
                  </p>
                  <p>
                        <strong>
                              ( ***&nbsp; Please do not reply to this email ***&nbsp; )
                        </strong>
                  </p>
            `

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        username: email.split('@')[0]
                  }
                  const htmlData = await compileHtml(
                        emailTemplateDetails.content,
                        contentData
                  )
                  if (htmlData) {
                        html = htmlData
                  }
            }

            const result = false && await sentEmail({
                  from: originEmails.marketing,
                  to: email,
                  subject,
                  html
            });
            if (false && !result) {
                  /** Return status 404 not found */
                  return next(
                        Boom.notFound(
                              authControllerResponse.sentVerifyEmailFailure
                        )
                  )
            }

            const title = 'Email auth enabled';
            const description = 'Now you can access holy reads by using your email and password';

            await notificationsService
                  .createNotification({
                        userId: user._id,
                        type: 'setting',
                        notification: {
                              title,
                              description
                        }
                  })

            fetchNotifications(io.sockets, { _id: user._id })
            res.status(200).send({
                  message: authControllerResponse.emailAuthEnabledSuccess
            })
            /** Push notification */
            if (
                  user &&
                  user.pushTokens &&
                  user.pushTokens.length &&
                  user?.notification?.push
            ) {
                  const tokens = user.pushTokens.map(i => i.token)
                  pushNotification(tokens, title, description)
            }
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/**  Get user subscription by user id */
const getUserSubscription = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            /** Get current user */
            let data: any = Object.assign({}, req.user)
            let subscriptionEndDate = new Date(
                  data.createdAt
            )
                  .getTime() + (trailDays * 24 * 60 * 60 * 1000);

            if (data.subscription) {
                  try {
                        data.subscription = await subscriptionService
                              .getOneSubscriptionByFilter({
                                    _id: data.subscription
                              })

                        data.subscriptionStatus = ['Active'].includes(data?.inAppSubscriptionStatus) ? data?.inAppSubscriptionStatus : 'freemium';
                        if (data?.stripe?.subscriptionId) {
                              await stripeSubscriptionService
                                    .retrieveSubscription(data.stripe?.subscriptionId)
                                    .then(res => {
                                          data.subscriptionStatus = res.status !== 'active' ? 'freemium' : res.status
                                          if (res.status !== 'active') {
                                                return;
                                          }
                                          data.inAppSubscriptionStatus = capitalizeFirstLetter(res.status)
                                    })
                        }
                        else if (false && data?.stripe?.paymentIntent) {
                              await stripeSubscriptionService
                                    .getPaymentIntent(data.stripe?.paymentIntent)
                                    .then(res => {
                                          if (res.status === 'succeeded') {
                                                data.inAppSubscriptionStatus = 'Active'
                                          } else {
                                                data.inAppSubscriptionStatus = res.status
                                          }
                                    })
                        }

                        /** set default subscription end date with 10 days trial */
                        if (data.subscription?._id) {
                              let months = data.subscription.duration === 'Month'
                                    ? 1 : data.subscription.duration === 'Half Year'
                                          ? 6 : 12;

                              const createdAt = data?.stripe?.createdAt
                                    || data?.inAppSubscription?.createdAt
                                    || new Date();

                              subscriptionEndDate = new Date(createdAt)
                                    .setMonth(
                                          new Date(createdAt).getMonth() + months
                                    )
                        }
                  } catch ({ message }: any) {
                        /** Handle get subscription error here */
                  }
            }
            data.subscriptionEndsIn
                  = getTimeDiff(
                        String(new Date()),
                        String(new Date(subscriptionEndDate))
                  )

            delete data.password
            delete data.smallGroups
            delete data.verificationCode
            delete data.library

            res
                  .status(200)
                  .send({
                        message: authControllerResponse.getUserSuccess,
                        data
                  })
      } catch ({ message }: any) {
            next(Boom.badData(message as string))
      }
}

const getCoupon = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            let coupon = await stripeSubscriptionService
                  .getOneCoupon(
                        req.params.coupon
                  )

            if (!coupon?.valid) {
                  /** Return status 404 not found */
                  return next(
                        Boom.preconditionFailed(
                              couponControllerResponse.invalidCoupon
                        )
                  )
            }

            res.status(200).send({
                  message: couponControllerResponse.fetchCouponSuccess,
                  data: coupon
            })

      } catch ({ message }: any) {
            return next(
                  Boom.badData(
                        message as string
                  )
            )
      }
}

/** Update user account details */
const updateUserAccount = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            /** Get current user */
            let userObj: any = Object.assign({}, req.user)
            const body: any = {
                  email: userObj.email,
                  firstName: req.body.firstName || userObj.firstName,
                  lastName: req.body.lastName || userObj.lastName,
                  notification: {
                        push: typeof eval(req.body?.notification?.push) === 'boolean'
                              ? req.body?.notification?.push
                              : userObj?.notification?.push || false,

                        email: typeof eval(req.body?.notification?.email) === 'boolean'
                              ? req.body?.notification?.email
                              : userObj?.notification?.email || false,

                        inApp: typeof eval(req.body?.notification?.inApp) === 'boolean'
                              ? req.body?.notification?.inApp
                              : userObj?.notification?.inApp || false,

                        subscription:
                              typeof eval(req.body?.notification?.subscription) === 'boolean'
                                    ? req.body?.notification?.subscription
                                    : userObj?.notification?.subscription || false,

                        dailyDevotional:
                              typeof eval(req.body?.notification?.dailyDevotional) === 'boolean'
                                    ? req.body?.notification?.dailyDevotional
                                    : userObj?.notification?.dailyDevotional || false,

                        offerAndDeal:
                              typeof eval(req.body?.notification?.offerAndDeal) === 'boolean'
                                    ? req.body?.notification?.offerAndDeal
                                    : userObj?.notification?.offerAndDeal || false,
                  },
                  downloadOverWifi:
                        typeof eval(req.body?.downloadOverWifi) === 'boolean'
                              ? req.body?.downloadOverWifi
                              : userObj?.downloadOverWifi || false
            }

            if (req.body.kindleEmail) {
                  const isValid = await validateEmail(req.body.kindleEmail);
                  if (!isValid) {
                        return next(Boom.notFound(authControllerResponse.inValidEmailError));
                  }
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

                  const s3File: any = await uploadFileToS3(
                        req.body.image, 'profile', s3Bucket
                  )
                  body.image = s3File.name
            }
            if (req.body.image && req.body.image.startsWith('http')) {
                  body.image = userObj.image
            }
            if (
                  req.body.pushTokens &&
                  req.body.pushTokens.token &&
                  req.body.pushTokens.deviceId
            ) {
                  body.pushTokens = req.user.pushTokens || []
                  const pushNotificationIndex = body.pushTokens
                        .findIndex(
                              item => item.deviceId === req.body.pushTokens.deviceId
                        )
                  if (pushNotificationIndex > -1) {
                        body.pushTokens[pushNotificationIndex].token
                              = req.body.pushTokens.token
                  } else {
                        body.pushTokens.push({
                              deviceId: req.body.pushTokens.deviceId,
                              token: req.body.pushTokens.token
                        })
                  }
            }
            if (req.body.id && req.body.provider) {
                  const userConflicts = await userService.getOneUserByFilter(
                        {
                              'oAuth.clientId': req.body.id,
                              _id: { '$ne': String(userObj._id) }
                        }
                  )
                  if (userConflicts) {
                        return next(
                              Boom.conflict(authControllerResponse.socialLinkError)
                        )
                  }
                  const oAuth = userObj.oAuth || []
                  const index = oAuth.findIndex(i => i.provider === req.body.provider)
                  if (index < 0) {
                        oAuth.push({
                              provider: req.body.provider,
                              clientId: req.body.id,
                              email: req.body.oAuthEmail
                                    || ''
                        })
                  }
                  else {
                        oAuth[index] = {
                              ...oAuth[index],
                              clientId: req.body.id,
                              email: req.body.oAuthEmail
                                    || oAuth[index].email
                                    || ''
                        }
                  }
                  body.oAuth = oAuth
            }
            if (req.body.provider && req.body.action === 'unlink') {
                  const oAuth = userObj.oAuth || []
                  if (
                        oAuth.length === 1 &&
                        oAuth.find(i =>
                              i.provider === req.body.provider) &&
                        (!userObj.password || !userObj.email)
                  ) {
                        return next(
                              Boom.notFound(
                                    authControllerResponse.missingEmailAuthError
                              )
                        )
                  }
                  body.oAuth = oAuth.filter(
                        i => i.provider !== req.body.provider
                  )
            }
            const subscriptionDetails = await subscriptionService
                  .getOneSubscriptionByFilter({ _id: userObj.subscription });
            const isAppSubscriptionStatus = !!subscriptionDetails
                  &&
                  ['Canceled', 'Active']
                        .includes(req.body.inAppSubscription?.status)
                  && !!userObj?.inAppSubscriptionStatus
                  && !!req.body.inAppSubscription?.status
                  !== userObj?.inAppSubscriptionStatus

            /** update in App subscription status */
            if (isAppSubscriptionStatus && subscriptionDetails) {
                  body.inAppSubscriptionStatus = req.body.inAppSubscription?.status
            }
            await usersService.updateUser({ _id: userObj._id }, body)
            /** sent email for subscription status updated */
            const notificationTitle = 'Holy Reads Subscription'
            const notificationDescription = isAppSubscriptionStatus &&
                  emailTemplatesTitles.customer.subscriptionActivated
                  ? `Holy Reads ${subscriptionDetails.duration.includes('Half')
                        ? subscriptionDetails.duration
                        : '1 ' + subscriptionDetails.duration} Subscription activated`
                  : 'Subscription canceled';

            if (isAppSubscriptionStatus && subscriptionDetails) {
                  const emailTemplateDetails = await emailTemplateService
                        .getOneEmailTemplateByFilter({
                              title: req.body.inAppSubscription.status === 'Active'
                                    ? emailTemplatesTitles.customer.subscriptionActivated
                                    : emailTemplatesTitles.customer.subscriptionCanceled
                        })
                  const subject = emailTemplateDetails.subject
                        || `Holy Reads Subscription ${req.body.inAppSubscription.status}`
                  let html = `
                        <p>
                              Dear ${userObj.email.split('@')[0]},
                        </p>
                        <p>
                              You have ${req.body.inAppSubscription.status} the subscription.
                        </p>
                        <p>
                              Should you have any questions or if any of your details change, please contact us.
                        </p>
                        <p>
                              Best regards,<br>Holy Reads
                        </p>
                        <p>
                              <strong>
                                    ( ***&nbsp; Please do not reply to this email ***&nbsp; )
                              </strong>
                        </p>
                  `
                  let now = userObj?.inAppSubscription?.createdAt
                  let subscriptionEndDate;
                  switch (subscriptionDetails.duration) {
                        case "Year":
                              subscriptionEndDate = new Date(
                                    now.setMonth(now.getMonth() + 12)
                              );
                              break;
                        case "Half Year":
                              subscriptionEndDate = new Date(
                                    now.setMonth(now.getMonth() + 6)
                              );
                              break;
                        default:
                              subscriptionEndDate = new Date(
                                    now.setMonth(now.getMonth() + 1)
                              );
                              break;
                  }

                  if (emailTemplateDetails && emailTemplateDetails.content) {
                        const contentData = {
                              username: userObj.email.split('@')[0],
                              endDate: subscriptionEndDate,
                              price: subscriptionDetails.price,
                        }
                        const htmlData = await compileHtml(
                              emailTemplateDetails.content, contentData
                        )
                        if (htmlData) {
                              html = htmlData
                        }
                  }

                  await notificationsService.createNotification({
                        userId: userObj._id,
                        type: 'setting',
                        notification: {
                              title: notificationTitle,
                              description: notificationDescription
                        }
                  })
                  fetchNotifications(io.sockets, { _id: userObj._id })

                  const result = await sentEmail({
                        from: originEmails.marketing,
                        to: userObj.email,
                        subject,
                        html
                  });
                  if (!result) {
                        return next(
                              Boom.badData(
                                    authControllerResponse.sentSubscriptionEmailFilure
                              )
                        )
                  }
            }
            res.status(200).send({
                  message: authControllerResponse.userUpdateSuccess
            })
            const kindleTitle = userObj.kindleEmail
                  ? 'Update Kindle Email' : 'Add Kindle Email'
            const kindleDescription = userObj.kindleEmail
                  ? 'Kindle email updated' : 'Kindle email added'
            if (req.body.kindleEmail) {
                  await notificationsService
                        .createNotification({
                              userId: userObj._id,
                              type: 'setting',
                              notification: {
                                    title: kindleTitle,
                                    description: kindleDescription
                              }
                        })
                  fetchNotifications(
                        io.sockets,
                        { _id: userObj._id }
                  )
            }
            /** Push notification */
            if (
                  userObj.pushTokens.length &&
                  userObj?.notification?.push
            ) {
                  const tokens = userObj.pushTokens.map(i => i.token)
                  req.body.kindleEmail
                        && pushNotification(
                              tokens,
                              kindleTitle,
                              kindleDescription
                        )
                  isAppSubscriptionStatus
                        && userObj?.notification?.subscription
                        && pushNotification(
                              tokens,
                              notificationTitle,
                              notificationDescription
                        )
            }
      } catch ({ message }: any) {
            return next(Boom.badData(message as string))
      }
}

/** get share option image url */
const getShareOptionImageUrl = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            if (req.body.image) {
                  const s3File: any = await uploadFileToS3(
                        req.body.image,
                        'share-image',
                        {
                              ...s3Bucket,
                              documentDirectory: 'users/share-options'
                        }
                  )
                  req.body.image = s3File.name
            }
            const imageUrl: string
                  = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.usersDirectory + '/share-options/' + req.body.image
            return res.status(200).send({
                  message: authControllerResponse.addShareImage,
                  data: { image: imageUrl }
            })
      } catch ({ message }: any) {
            return next(Boom.badData(message as string))
      }
}

/** get encode image */
const getEncodeImage = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            if (req.body.image) {
                  req.body.image = await imageUrlToBase64(req.body.image);
            }
            return res.status(200).send({
                  message: authControllerResponse.encodeImageSuccess,
                  data: { image: req.body.image }
            })
      } catch ({ message }: any) {
            return next(Boom.badData(message as string))
      }
}

/** Update user library details */
const updateUserLibrary = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const { type, section } = req.query as any

            let message = authControllerResponse.userUpdateSuccess
            /** Get user from db */
            const userObj: any = Object.assign({}, req.user)

            if (!section) {
                  return next(
                        Boom.notFound(
                              authControllerResponse.missingSectionParams
                        )
                  )
            }

            const query: any = { _id: userObj.libraries }
            userObj.libraries = await usersService.getUserLibrary(query)

            if (section === 'completed') {
                  req.body['$addToSet'] = {
                        'completed': req.body.completed
                  }
                  delete req.body.completed
                  message = authControllerResponse.markAsCompletedBook
            }
            if (type === 'add' && section === 'saved') {
                  req.body['$addToSet'] = {
                        'saved': req.body.saved
                  }
                  delete req.body.saved
                  message = authControllerResponse.savedBook
            }
            if (type === 'delete' && section === 'saved') {
                  req.body['$pull'] = { 'saved': req.body.saved }
                  delete req.body.saved
                  message = authControllerResponse.unSavedBook
            }
            if (section === 'reading') {
                  const bookSummary = await bookService.findBook({
                        _id: req.body.bookId,
                        'chapters._id': req.body.chapter
                  })
                  if (!bookSummary) {
                        return next(Boom.notFound(
                              bookSummaryControllerResponse.chapterNotExist
                        ))
                  }

                  const readingObj = await userObj
                        .libraries
                        ?.reading
                        ?.find(
                              oneRead => String(oneRead.bookId) === req.body.bookId
                        )

                  if (!readingObj) {
                        if (!userObj?.libraries) {
                              userObj.libraries = {}
                        }
                        if (!userObj?.libraries?.reading) {
                              userObj.libraries.reading = []
                        }
                        userObj.libraries.reading.push({
                              updatedAt: new Date(),
                              bookId: req.body.bookId,
                              chaptersCompleted: [req.body.chapter],
                        })
                        await usersService.updateUserLibrary(
                              query,
                              userObj.libraries
                        )
                        return res
                              .status(200)
                              .send({
                                    message: authControllerResponse.userUpdateSuccess
                              })
                  }

                  readingObj.chaptersCompleted =
                        readingObj
                              .chaptersCompleted
                              .filter(i => i !== req.body.chapter)
                  readingObj
                        .chaptersCompleted
                        .push(req.body.chapter)

                  query['reading.bookId'] = req.body.bookId

                  req.body['$set'] = {
                        'reading.$.updatedAt': new Date(),
                        'reading.$.chaptersCompleted': readingObj.chaptersCompleted
                  }

                  delete req.body.bookId
                  delete req.body.chapter
            }
            const addToReads = async () => {
                  const readingObj = await userObj
                        .libraries
                        ?.reading
                        ?.find(
                              oneRead => String(oneRead.bookId) === req.body.bookId
                        )
                  if (!readingObj) {
                        if (!userObj?.libraries?.reading) {
                              userObj.libraries.reading = []
                        }
                        userObj.libraries.reading.push({
                              updatedAt: new Date(),
                              bookId: Types.ObjectId(req.body.bookId),
                              chaptersCompleted: [],
                        })
                        await usersService.updateUserLibrary(
                              { _id: query._id },
                              userObj.libraries
                        )
                        return;
                  }
                  await userService.updateUserLibrary(
                        {
                              _id: query._id,
                              'reading.bookId': Types.ObjectId(req.body.bookId)
                        },
                        {
                              '$set': {
                                    'reading.$.updatedAt': new Date()
                              }
                        }
                  );
            }
            if (section === 'view') {
                  const bookSummary = await bookService.findBook({
                        _id: req.body.bookId
                  })
                  if (!bookSummary) {
                        return next(
                              Boom.notFound(
                                    bookSummaryControllerResponse.getBookSummaryFailure
                              )
                        )
                  }
                  const viewObj = userObj
                        .libraries
                        ?.view
                        ?.find(bookItem => String(bookItem.bookId) === req.body.bookId)
                  if (!userObj?.libraries) {
                        userObj.libraries = {}
                  }
                  if (!viewObj) {
                        if (!userObj?.libraries?.view) {
                              userObj.libraries.view = []
                        }
                        userObj.libraries.view.push({
                              bookId: req.body.bookId,
                              createdAt: new Date()
                        })
                        await usersService.updateUserLibrary(
                              query, userObj.libraries
                        )
                        await addToReads()
                        return res.status(200).send({
                              message: authControllerResponse.userUpdateSuccess
                        })
                  }

                  query['view.bookId'] = req.body.bookId
                  req.body['$set'] = {
                        'view.$.bookId': req.body.bookId
                  }
                  await addToReads()
                  delete req.body.bookId
            }
            /** Add to User small group */
            if (type === 'add' && section === 'smallGroup') {
                  req.body['$addToSet'] = {
                        'smallGroups': req.body.smallGroup
                  }
                  delete req.body.smallGroup
                  message = authControllerResponse.savedBook
            }
            /** Delete from User small group */
            if (type === 'delete' && section === 'smallGroup') {
                  req.body['$pull'] = {
                        'smallGroups': req.body.smallGroup
                  }
                  delete req.body.smallGroup
                  message = authControllerResponse.unSavedBook
            }

            await usersService.updateUserLibrary(query, req.body)
            return res.status(200).send({ message })

      } catch ({ message }: any) {
            return next(Boom.badData(message as string))
      }
}

/**  Get one user library by library id */
const getUserLibrary = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const {
                  sort,
                  star,
                  author,
                  bookId,
                  section,
                  skip = dataLimit.skip,
                  limit = dataLimit.limit
            } = req.query as any

            /** Get current user */
            let userObj: any = Object.assign({}, req.user)
            userObj.libraries = await usersService.getUserLibrary({
                  _id: userObj.libraries
            })
            if (bookId && !section) {
                  const book = userObj?.libraries?.saved?.find(
                        id => String(id) === bookId
                  )
                  userObj.libraries.reading
                        = userObj.libraries.reading.filter(
                              i => String(i.bookId) === String(bookId)
                        )
                  res.status(200).send({
                        message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
                        data: {
                              library: userObj.libraries,
                              saved: book ? true : false
                        }
                  })
                  return null
            }

            if (section === 'saved' && userObj?.libraries?.saved?.length) {
                  const search: any = {
                        _id: {
                              $in: bookId ? [bookId] : userObj.libraries.saved
                        }
                  }
                  if (author) {
                        search['author._id'] = Types.ObjectId(author)
                  }
                  if (star) {
                        search.star = Number(star)
                  }
                  const data = await bookService.getAllBookSummaries(
                        0,
                        0,
                        search,
                        {
                              'createdAt': String(sort || 'ASC')
                                    .toLowerCase() === 'asc' ? 1.0 : -1.0
                        }
                  )
                  if (data.summaries?.length) {
                        data.summaries = userObj.libraries.saved
                              .reverse().map(oi => {
                                    return data.summaries.find(
                                          si => String(si._id) === String(oi)
                                    )
                              }).filter(i => i)

                        if (sort)
                              data.summaries = sortArrayObject(
                                    data.summaries, 'title', sort.toLowerCase()
                              )

                        data.count = data.summaries.length
                        data.summaries = data.summaries
                              .slice(
                                    Number(skip),
                                    Number(skip) + Number(limit)
                              )
                  }
                  res.status(200).send({
                        message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
                        data
                  })
                  return null
            }

            if (section === 'completed' && userObj?.libraries?.completed?.length) {
                  const search: any = {
                        _id: {
                              $in: bookId ? [bookId] : userObj.libraries.completed
                        }
                  }
                  if (author) {
                        search['author._id'] = Types.ObjectId(author)
                  }
                  if (star) {
                        search.star = Number(star)
                  }
                  const data = await bookService.getAllBookSummaries(
                        0,
                        0,
                        search,
                        {
                              'createdAt': String(sort || 'ASC')
                                    .toLowerCase() === 'asc' ? 1.0 : -1.0
                        }
                  )
                  if (data.summaries?.length) {
                        data.summaries = userObj
                              .libraries
                              .completed
                              .reverse()
                              .map(oi => {
                                    return data.summaries.find(
                                          si => String(si._id) === String(oi)
                                    )
                              })
                              .filter(i => i)

                        if (sort)
                              data.summaries = sortArrayObject(
                                    data.summaries,
                                    'title',
                                    sort.toLowerCase()
                              )

                        data.count = data.summaries.length
                        data.summaries = data.summaries
                              .slice(
                                    Number(skip),
                                    Number(skip) + Number(limit)
                              )
                  }
                  res.status(200).send({
                        message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
                        data
                  })
                  return null
            }
            if (
                  section === 'reading' &&
                  userObj?.libraries?.reading?.length
            ) {
                  /** collect user reads books ids those not in completed books list */
                  const bookIds = new Set()
                  if (
                        bookId &&
                        !userObj.libraries?.completed?.find(
                              cb => String(cb) === String(bookId)
                        )
                  ) { bookIds.add(bookId) }
                  else if (!bookId) {
                        userObj.libraries.reading.map(oneBook => {
                              if (
                                    oneBook.bookId &&
                                    !userObj.libraries?.completed?.find(
                                          cb => String(cb) === String(oneBook.bookId)
                                    )
                              ) bookIds.add(oneBook.bookId)
                        })
                  }

                  /** Prepare query to get users reads book details */
                  const search: any = {
                        _id: { $in: [...bookIds] }
                  }
                  if (author) {
                        search['author._id'] = Types.ObjectId(author)
                  }
                  if (star) {
                        search.star = Number(star)
                  }

                  /** Get user reads books details by users reads books ids */
                  const data = await bookService.getAllBookSummaries(
                        0,
                        0,
                        search,
                        { 'createdAt': -1.0 },
                        true
                  )

                  /** sort summary by latest reads based on user libraries readings */
                  const summaries = new Set()
                  userObj.libraries.reading.map(r => {
                        const summary = data.summaries.find(
                              (os: any) => String(os._id) === String(r.bookId)
                        )
                        if (!summary) return;
                        summary.reads = Number(
                              (
                                    r.chaptersCompleted &&
                                          r.chaptersCompleted?.length
                                          ?
                                          (
                                                100
                                                *
                                                r.chaptersCompleted?.length
                                          ) /
                                          summary?.chapters?.length
                                          : 0
                              ).toFixed(0))
                        summary.updatedAt = r.updatedAt
                        delete summary.chapters
                        summaries.add(summary)
                  })
                  data.summaries = [...summaries]
                  if (sort) data.summaries = sortArrayObject(
                        data.summaries, 'title', sort.toLowerCase()
                  )
                  else data.summaries = sortArrayObject(
                        data.summaries, 'updatedAt', 'desc'
                  )
                  data.count = data.summaries.length
                  data.summaries = data.summaries
                        .slice(
                              Number(skip),
                              Number(skip) + Number(limit)
                        )
                  res.status(200).send({
                        message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
                        data
                  })
                  return null
            }
            res.status(200).send({
                  message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
                  data: []
            })
      } catch ({ message }: any) {
            next(Boom.badData(message as string))
      }
}

const submitQuery = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const {
                  subject,
                  message,
                  phone
            }: {
                  subject: string,
                  message: string,
                  phone: number
            } = req.body;

            const userObj = Object.assign({}, req.user)
            const emailTemplateDetails = await emailTemplateService
                  .getOneEmailTemplateByFilter({
                        title: emailTemplatesTitles.admin.customerInquiry
                  })
            const sub = emailTemplateDetails.subject || 'Customer Inquiry'
            let html = `
                  <p>
                        Hello Admin,
                  </p>
                  <p>
                        You receive a support message from user.
                  </p>
                  <p>
                        Email : ${userObj.email}
                  </p>
                  <p>
                        Phone Number : ${userObj.contactNumber || phone}
                  </p>
                  <p>
                        Subject : ${subject}
                  </p>
                  <p>
                        Message : ${message}
                  </p>
                  <p>
                        Best regards,
                  </p>
                  <p>
                        ${userObj.email.split('@')[0]}
                  </p>
            `

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        username: userObj.email.split('@')[0],
                        email: userObj.email,
                        phone_number: userObj.contactNumber || phone,
                        subject,
                        message
                  }
                  const htmlData = await compileHtml(
                        emailTemplateDetails.content,
                        contentData
                  )
                  if (htmlData) {
                        html = htmlData
                  }
            }
            const result = await sentEmail({
                  from: originEmails.marketing,
                  to: originEmails.contactUs,
                  subject: sub,
                  html
            });

            if (!result) {
                  return next(
                        Boom.badData(
                              authControllerResponse.submitQueryError
                        )
                  )
            }
            res.status(200).send({
                  message: authControllerResponse.submitQuerySuccess
            })
      } catch ({ message }: any) {
            next(Boom.badData(message as string))
      }
}

const submitFeedback = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const {
                  title,
                  feedback
            }: {
                  title: string,
                  feedback: string
            } = req.body;
            const userObj = Object.assign({}, req.user)
            const emailTemplateDetails = await emailTemplateService
                  .getOneEmailTemplateByFilter({
                        title: emailTemplatesTitles.admin.customerFeedback
                  })
            const subject = emailTemplateDetails.subject || 'Customer Feedback'
            let html = `
                  <p>
                        You've received a feedback from ${userObj.email}.
                  </p>
                  <p>
                        Title : ${title}
                  </p>
                  <p>
                        Feedback : ${feedback}
                  </p>
            `

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        email: userObj.email,
                        title,
                        feedback
                  }
                  const htmlData = await compileHtml(
                        emailTemplateDetails.content, contentData
                  )
                  if (htmlData) {
                        html = htmlData
                  }
            }

            const result = await sentEmail({
                  from: originEmails.marketing,
                  to: originEmails.contactUs,
                  subject,
                  html
            });

            if (!result) {
                  return next(
                        Boom.badData(
                              authControllerResponse.submitQueryError
                        )
                  )
            }

            res.status(200).send({
                  message: authControllerResponse.submitQuerySuccess
            })
      } catch ({ message }: any) {
            next(Boom.badData(message as string))
      }
}

const updateRating = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const {
                  star,
                  bookId,
                  description,
            }: {
                  star: number,
                  bookId: string,
                  description: string,
            } = req.body;

            const userObj = Object.assign({}, req.user)
            await ratingService.updateRating({
                  star,
                  bookId,
                  description,
                  userId: userObj._id
            });

            res.status(200).send({
                  message: authControllerResponse.bookRatingSuccess
            })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/** Add User by referral */
const blessFriend = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const body = req.body
            const isValid = await validateEmail(body.friendEmail);
            if (!isValid) {
                  return next(Boom.notFound(authControllerResponse.inValidEmailError));
            }
            body.email = body.friendEmail
            delete body.friendEmail
            const refUser: any = await usersService
                  .getOneUserByFilter({
                        email: req.user.email
                  })
            if (!refUser) {
                  return next(
                        Boom.notFound(
                              authControllerResponse.getReferralUserError
                        )
                  )
            }
            /** Get user from db */
            const inviteUser: any = await usersService
                  .getOneUserByFilter({ email: body.email })
            if (inviteUser) {
                  return next(
                        Boom.conflict(
                              authControllerResponse.userAlreadyExistError
                        )
                  )
            }
            const subscriptionDetails = await subscriptionService
                  .getOneSubscriptionByFilter({
                        _id: body.subscription
                  })
            if (!subscriptionDetails) {
                  /** Return status code 404 not found */
                  return next(
                        Boom.notFound(
                              authControllerResponse.blessFriendSubscriptionError
                        )
                  )
            }
            const verificationCode = Math.floor(1000 + Math.random() * 9000)
            const token: string = getToken({
                  code: String(verificationCode),
                  email: body.email
            })
            const link: string = `${origins[NODE_ENV]}/account/verify-user?token=${token}`

            const inviteUserBody: any = {
                  image: '',
                  type: 'User',
                  verified: false,
                  verificationCode,
                  email: body.email,
                  status: 'Deactive',
                  password: body.password,
                  referralUserId: refUser._id,
                  device: body.device || 'web',
                  subscription: subscriptionDetails._id,
            }
            let subscriptionEndDate, subscription;
            if (!body.inAppSubscription) {
                  const customer = await stripeSubscriptionService
                        .createCustomer(
                              body.email,
                              req.body.token
                        )
                  subscription = await stripeSubscriptionService.createSubscription({
                        status: 'active',
                        customerId: customer.id,
                        coupon: req.body.coupon as any,
                        paymentMethod: req.body.paymentMethod,
                        planId: subscriptionDetails.stripePlanId,
                  })
                  inviteUserBody.stripe = {
                        createdAt: new Date(),
                        customerId: customer.id,
                        subscriptionId: subscription.id,
                        planId: subscriptionDetails.stripePlanId,
                  }
                  subscriptionEndDate = new Date(subscription.current_period_end * 1000)
                  if (subscription.status === 'trialing') {
                        let now = new Date(subscriptionEndDate)
                        switch (subscriptionDetails.duration) {
                              case "Year":
                                    subscriptionEndDate = new Date(
                                          now.setMonth(now.getMonth() + 12)
                                    );
                                    break;
                              case "Half Year":
                                    subscriptionEndDate = new Date(
                                          now.setMonth(now.getMonth() + 6)
                                    );
                                    break;
                              default:
                                    subscriptionEndDate = new Date(
                                          now.setMonth(now.getMonth() + 1)
                                    );
                                    break;
                        }
                  }
            } else {
                  inviteUserBody.inAppSubscription = {
                        ...body.inAppSubscription,
                        createdAt: new Date()
                  }
                  inviteUserBody.inAppSubscriptionStatus = 'Active'
                  let now = new Date()
                  switch (subscriptionDetails.duration) {
                        case "Year":
                              subscriptionEndDate = new Date(
                                    now.setMonth(new Date().getMonth() + 12)
                              );
                              break;
                        case "Half Year":
                              subscriptionEndDate = new Date(
                                    now.setMonth(new Date().getMonth() + 6)
                              );
                              break;
                        default:
                              subscriptionEndDate = new Date(
                                    now.setMonth(new Date().getMonth() + 1)
                              );
                              break;
                  }
            }
            const invitedUserDetails = await authService
                  .createUser(inviteUserBody)
            if (!invitedUserDetails || !invitedUserDetails._id) {
                  /** Return status code 404 not found */
                  return next(
                        Boom.notFound(
                              authControllerResponse.createUserFailed
                        )
                  )
            }

            const sendEmailTemplate = await emailTemplateService
                  .getAllEmailTemplates(
                        0,
                        0,
                        {
                              title: {
                                    $in: [
                                          emailTemplatesTitles.customer.sendInvitation,
                                          emailTemplatesTitles.customer.blessFriend
                                    ]
                              }
                        },
                        []
                  )
            const blessFriendTemplate = sendEmailTemplate.count
                  && sendEmailTemplate.emailTemplates.find(
                        oneTemplate =>
                              oneTemplate.title
                              ===
                              emailTemplatesTitles.customer.blessFriend
                  )
            const sendInvitationTemplate = sendEmailTemplate.count
                  && sendEmailTemplate
                        .emailTemplates
                        .find(oneTemplate =>
                              oneTemplate.title
                              ===
                              emailTemplatesTitles.customer.sendInvitation
                        )

            const blessFriendSubject = blessFriendTemplate?.subject
                  || 'Customer Registration Bless Friend'
            const sendInvitationSubject = sendInvitationTemplate?.subject
                  || 'Send Invitation'

            let blessFriendHtml = `     
                  <p>
                        Dear ${refUser.email.split('@')[0]},
                  </p>
                  <p>
                        Thank you for registered with Holy Reads.
                  </p>
                  <p>
                        Your customer account details are below:
                  </p>
                  <p>
                        Email : ${body.email}<br>Password: ${body.password}
                  </p>
                  <p>
                        Should you have any questions or if any of your details change, please contact us.
                  </p>
                  <p>
                        Best regards,<br>Holy reads
                  </p>
                  <p>
                        <strong>
                              ( ***&nbsp; Please do not reply to this email ***&nbsp; )
                        </strong>
                  </p>
            `
            let sentInvitationHtml = `
                  <p>
                        Dear ${body.email.split('@')[0]}
                  </p>
                  <p>
                        ${refUser.email.split('@')[0]} invited you to connect on Holy Reads
                  </p>
                  <p>
                        Your customer account details are below:
                  </p>
                  <p>
                        Email : ${body.email}<br>Password: ${body.password}
                  </p>
                  <p>
                        Please click <a href=${link}>Here</a> to accept invite.
                  </p>
                  <p>
                        Should you have any questions or if any of your details change, please contact us.
                  </p>
                  <p>
                        Best regards,<br>Holy reads
                  </p>
                  <p>
                        <strong>( ***&nbsp; Please do not reply to this email ***&nbsp; )</strong><
                  /p>
            `

            if (blessFriendTemplate && blessFriendTemplate.content) {
                  const contentData = {
                        email: body.email,
                        username: body
                              .email
                              .substr(
                                    0, refUser.email.indexOf('@')
                              ),
                        plan: subscriptionDetails.duration + 'ly'
                  }
                  const htmlData = await compileHtml(
                        blessFriendTemplate.content,
                        contentData
                  )
                  if (htmlData) {
                        blessFriendHtml = htmlData
                  }
            }
            if (
                  sendInvitationTemplate &&
                  sendInvitationTemplate.content
            ) {
                  const contentData = {
                        link,
                        email: body.email,
                        password: body.password,
                        sendername: refUser.email.split('@')[0],
                        plan: subscriptionDetails.duration + 'ly'
                  }
                  const htmlData = await compileHtml(
                        sendInvitationTemplate.content,
                        contentData
                  )
                  if (htmlData) {
                        sentInvitationHtml = htmlData
                  }
            }

            const blessFriendEmailResult = await sentEmail({
                  from: originEmails.marketing,
                  to: refUser.email,
                  subject: blessFriendSubject,
                  html: blessFriendHtml
            });

            const sendInvitationResult = await sentEmail({
                  from: originEmails.marketing,
                  to: body.email,
                  subject: sendInvitationSubject,
                  html: sentInvitationHtml
            });

            if (!blessFriendEmailResult || !sendInvitationResult) {
                  /** Return 422 status code unprocessable entity */
                  return next(
                        Boom.badData(
                              authControllerResponse.sentVerifyEmailFailure
                        )
                  )
            }

            await notificationsService.createNotification({
                  userId: invitedUserDetails._id,
                  type: 'setting',
                  notification: {
                        title: 'Holy Reads Invitation 🎁',
                        description: refUser.email.split('@')[0] + ' invited to you ✨'
                  }
            })
            fetchNotifications(io.sockets, { _id: invitedUserDetails._id })

            if (!inviteUserBody?.inAppSubscription) {
                  return res.status(200).send({
                        message: authControllerResponse.blessFriendSuccess
                  })
            }

            const emailTemplateDetails = await emailTemplateService
                  .getOneEmailTemplateByFilter({
                        title: emailTemplatesTitles.customer.chooseSubscription
                  })
            const subject = emailTemplateDetails.subject || 'Subscription'
            let html = `
                  <p>
                        Dear ${body.email.split('@')[0]},
                  </p>
                  <p>
                        You have subscribed to ${subscriptionDetails.title} Plan for ${subscriptionDetails.duration} days on ${subscriptionDetails.title} basis.
                  </p>
                  <p>
                        Should you have any questions or if any of your details change, please contact us.
                  </p>
                  <p>
                        Best regards,<br>Holy Reads
                  </p>
                  <p>
                        <strong>
                              ( ***&nbsp; Please do not reply to this email ***&nbsp; )
                        </strong>
                  </p>`

            if (emailTemplateDetails && emailTemplateDetails.content) {
                  const contentData = {
                        price: subscriptionDetails.price,
                        username: body.email.split('@')[0],
                        status: subscription?.status || 'Active',
                        endDate: `${formattedDate(subscriptionEndDate)}`,
                        duration: subscriptionDetails
                              ?.duration
                              ?.toLowerCase()
                              ?.includes('half')
                              ? subscriptionDetails.duration
                              : `1 ${subscriptionDetails.duration}`
                  }
                  const htmlData = await compileHtml(
                        emailTemplateDetails.content,
                        contentData
                  )
                  if (htmlData) {
                        html = htmlData
                  }
            }
            const result = await sentEmail({
                  from: originEmails.marketing,
                  to: body.email,
                  subject,
                  html
            });
            if (!result) {
                  return next(
                        Boom.badData(
                              authControllerResponse.sentSubscriptionEmailFilure
                        )
                  )
            }

            res.status(200).send({
                  message: authControllerResponse.blessFriendSuccess
            })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

/** Create payment sheet */
const paymentSheet = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const userObj = req.user
            const subscriptionDetails = await subscriptionService
                  .getOneSubscriptionByFilter({
                        _id: req.body.subscription
                  })
            if (!subscriptionDetails) {
                  /** Return status code 404 not found */
                  return next(
                        Boom.notFound(
                              subscriptionsControllerResponse.getSubscriptionFailure
                        )
                  )
            }
            if (!userObj?.stripe?.customerId) {
                  const customer = await stripeSubscriptionService
                        .createCustomer(
                              userObj.email,
                              req.body.token
                        )
                  if (!userObj.stripe) { userObj.stripe = {} }
                  userObj.stripe.customerId = customer.id
                  await usersService.updateUser(
                        { _id: userObj._id },
                        { 'stripe.customerId': customer.id }
                  )
            }

            const ephemeralKey = await stripeSubscriptionService.createEphemeralKey(
                  userObj.stripe.customerId
            );

            const paymentIntent = await stripeSubscriptionService.createPaymentIntent({
                  amount: Number(subscriptionDetails.price) * 100,
                  currency: 'usd',
                  customer: userObj.stripe.customerId,
                  automatic_payment_methods: {
                        enabled: true,
                  },
                  /** Store new plan details in metadata */
                  metadata: {
                        planId: subscriptionDetails.stripePlanId,
                        ephemeralKey: ephemeralKey?.id,
                        hrSubscriptionId: String(subscriptionDetails._id)
                  }
            });

            res.status(200).send({
                  message: subscriptionsControllerResponse.createPaymentSheetSuccess,
                  data: {
                        paymentIntentId: paymentIntent?.id,
                        clientSecret: paymentIntent?.client_secret,
                        customerEmail: userObj.email,
                        customerId: userObj?.stripe?.customerId,
                        ephemeralKey: ephemeralKey?.secret
                  }
            })

      } catch ({ message }: any) {
            next(Boom.badData(message as string))
      }
}

/** subscribe plan */
const subscribePlan = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const userObj = req.user
            const subscriptionDetails = await subscriptionService
                  .getOneSubscriptionByFilter({
                        _id: req.body.subscription
                  })
            if (!subscriptionDetails) {
                  /** Return status code 404 not found */
                  return next(
                        Boom.notFound(
                              subscriptionsControllerResponse.getSubscriptionFailure
                        )
                  )
            }
            let body: any = {};
            let subscription;
            let subscriptionEndDate;
            if (req.body.inAppSubscription) {
                  body = {
                        subscription: req.body.subscription,
                        inAppSubscription: {
                              ...req.body.inAppSubscription,
                              createdAt: new Date()
                        },
                        inAppSubscriptionStatus: 'Active',
                  }
                  let now = new Date()
                  switch (subscriptionDetails.duration) {
                        case "Year":
                              subscriptionEndDate = new Date(
                                    now.setMonth(new Date().getMonth() + 12)
                              );
                              break;
                        case "Half Year":
                              subscriptionEndDate = new Date(
                                    now.setMonth(new Date().getMonth() + 6)
                              );
                              break;
                        default:
                              subscriptionEndDate = new Date(
                                    now.setMonth(new Date().getMonth() + 1)
                              );
                              break;
                  }
            } else {
                  if (!userObj?.stripe?.customerId) {
                        const customer = await stripeSubscriptionService
                              .createCustomer(
                                    userObj.email,
                                    req.body.token
                              )
                        if (!userObj.stripe) { userObj.stripe = {} }
                        userObj.stripe.customerId = customer.id
                        await usersService.updateUser(
                              { _id: userObj._id },
                              { 'stripe.customerId': customer.id }
                        )
                  }
                  if (!userObj?.stripe?.subscriptionId) {
                        subscription = await stripeSubscriptionService.createSubscription({
                              status: 'active',
                              coupon: req.body.coupon,
                              customerId: userObj.stripe.customerId,
                              paymentMethod: req.body.paymentMethod,
                              planId: subscriptionDetails.stripePlanId,
                        })
                        subscriptionEndDate = new Date(
                              subscription.current_period_end * 1000
                        )
                        body['stripe.coupon'] = req.body.coupon
                  } else {
                        const retrieveSubscription = await stripeSubscriptionService
                              .retrieveSubscription(
                                    userObj?.stripe?.subscriptionId
                              )
                        if (['incomplete'].includes(retrieveSubscription.status)) {
                              await stripeSubscriptionService.cancelSubscription(
                                    retrieveSubscription.id
                              )
                        }

                        if (
                              [
                                    'canceled',
                                    'incomplete',
                                    'incomplete_expired'
                              ].includes(
                                    retrieveSubscription.status
                              )
                        ) {
                              await stripeSubscriptionService.createSubscription({
                                    status: 'active',
                                    coupon: req.body.coupon,
                                    customerId: userObj.stripe.customerId,
                                    paymentMethod: req.body.paymentMethod,
                                    planId: subscriptionDetails.stripePlanId,
                              })
                              body['stripe.coupon'] = req.body.coupon
                        } else {
                              await stripeSubscriptionService.updateSubscription({
                                    coupon: req.body.coupon,
                                    customerId: userObj.stripe.customerId,
                                    paymentMethod: req.body.paymentMethod,
                                    planId: subscriptionDetails.stripePlanId,
                                    subscriptionId: userObj.stripe.subscriptionId,
                              })
                              body['stripe.coupon'] = req.body.coupon
                        }
                        subscription = await stripeSubscriptionService
                              .retrieveSubscription(
                                    userObj.stripe.subscriptionId
                              )
                        subscriptionEndDate = new Date(
                              subscription.current_period_end * 1000
                        )
                  }
                  if (subscription.status === 'trialing') {
                        let now = new Date(subscriptionEndDate)
                        switch (subscriptionDetails.duration) {
                              case "Year":
                                    subscriptionEndDate = new Date(
                                          now.setMonth(now.getMonth() + 12)
                                    );
                                    break;
                              case "Half Year":
                                    subscriptionEndDate = new Date(
                                          now.setMonth(now.getMonth() + 6)
                                    );
                                    break;
                              default:
                                    subscriptionEndDate = new Date(
                                          now.setMonth(now.getMonth() + 1)
                                    );
                                    break;
                        }
                  }
                  /** add stripe details into body */
                  body = {
                        'stripe.createdAt': new Date(),
                        subscription: subscriptionDetails._id,
                        'stripe.subscriptionId': subscription.id,
                        'stripe.planId': subscriptionDetails.stripePlanId,
                  }
                  // Update coupon id and status if user redeem coupon
                  const isUserRedeemCoupon = subscription && !userObj.stripe.coupon && userObj.stripe.status !== 'active' && req.body.coupon;
                  const couponId = subscription.discount?.coupon?.id;

                  if (isUserRedeemCoupon && couponId) {
                        body['stripe.coupon'] = couponId;
                        body['stripe.status'] = subscription.status;
                  }
            }
            await usersService.updateUser({ _id: userObj._id }, body)

            if (!req.body?.inAppSubscription) {
                  const ephemeralKey = await stripeSubscriptionService
                        .createEphemeralKey(
                              userObj.stripe.customerId
                        );
                  return res.status(200).send({
                        message: subscriptionsControllerResponse.createSubscriptionSuccess,
                        data: {
                              subscriptionStatus: subscription.status,
                              paymentIntentId: subscription
                                    ?.latest_invoice
                                    ?.payment_intent
                                    ?.id,
                              clientSecret: subscription
                                    ?.latest_invoice
                                    ?.payment_intent
                                    ?.client_secret,
                              customerEmail: userObj.email,
                              customerId: userObj
                                    ?.stripe
                                    ?.customerId,
                              ephemeralKey: ephemeralKey
                                    ?.secret
                        }
                  })
            }

            const emailTemplateDetails = await emailTemplateService
                  .getOneEmailTemplateByFilter({
                        title: emailTemplatesTitles.customer.chooseSubscription
                  })
            const subject = emailTemplateDetails.subject || 'Holy Reads Subscription'
            let html = `
                  <p>
                        Dear ${userObj.email.split('@')[0]},
                  </p>
                  <p>
                        You have subscribed to ${subscriptionDetails.title} Plan for ${subscriptionDetails.duration} days on ${subscriptionDetails.title} basis.
                  </p>
                  <p>
                        Should you have any questions or if any of your details change, please contact us.
                  </p>
                  <p>
                        Best regards,<br>Holy Reads
                  </p>
                  <p>
                        <strong>
                              ( ***&nbsp; Please do not reply to this email ***&nbsp; )
                        </strong>
                  </p>
            `

            if (emailTemplateDetails && emailTemplateDetails.content) {

                  const contentData = {
                        price: subscriptionDetails.price,
                        username: userObj.email.split('@')[0],
                        status: subscription?.status || 'Active',
                        endDate: `${formattedDate(subscriptionEndDate).replace(/ /g, ',')}`,
                        duration: subscriptionDetails
                              ?.duration?.toLowerCase()?.includes('half')
                              ? subscriptionDetails.duration
                              : `1 ${subscriptionDetails.duration}`,
                  }
                  const htmlData = await compileHtml(
                        emailTemplateDetails.content,
                        contentData
                  )
                  if (htmlData) {
                        html = htmlData
                  }
            }
            const notificationTitle = 'Holy Reads Subscription'
            const notificationDescription = `Holy Reads ${subscriptionDetails.duration.includes('Half')
                  ? subscriptionDetails.duration
                  : '1 ' + subscriptionDetails.duration
                  } subscription has been activated! 🎉`
            await notificationsService.createNotification({
                  userId: userObj._id,
                  type: 'setting',
                  notification: {
                        title: notificationTitle,
                        description: notificationDescription
                  }
            })
            fetchNotifications(
                  io.sockets,
                  { _id: userObj._id }
            )

            const result = await sentEmail({
                  from: originEmails.marketing,
                  to: userObj.email,
                  subject,
                  html
            });
            if (!result) {
                  return next(
                        Boom.badData(
                              authControllerResponse.sentSubscriptionEmailFilure
                        )
                  )
            }

            res.status(200).send({
                  message: subscriptionsControllerResponse.createSubscriptionSuccess,
                  data: !req.body?.inAppSubscription ? {
                        subscriptionStatus: subscription.status,
                        customerEmail: userObj.email
                  } : { subscription: subscriptionDetails._id }
            })

            /** Push notification */
            if (
                  req.user.pushTokens.length &&
                  userObj?.notification?.push &&
                  userObj?.notification?.subscription
            ) {
                  const tokens = req.user.pushTokens.map(i => i.token)
                  pushNotification(
                        tokens,
                        notificationTitle,
                        notificationDescription
                  )
            }
      } catch ({ message }: any) {
            next(Boom.badData(message as string))
      }
}

/** Remove User */
const deleteUser = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const userObj: any = req.user
            await usersService.deleteUser(userObj._id)
            mailchimpService.updateUser(userObj.email, 'unsubscribed')
            res.status(200).send({
                  message: authControllerResponse.deleteUserSuccess
            })
            if (userObj && userObj.image) {
                  removeS3File(userObj.image, s3Bucket)
            }
            if (userObj?.stripe?.subscriptionId) {
                  stripeSubscriptionService
                        .cancelSubscription(
                              userObj.stripe.subscriptionId
                        )
            }
            Promise.all([
                  ratingService.deleteRatings({
                        userId: userObj._id
                  }),
                  highLightsService.deleteHighLights({
                        userId: userObj._id
                  }),
                  transactionsService.deleteTransaction({
                        userId: userObj._id
                  }),
                  notificationsService.deleteNotifications({
                        userId: userObj._id
                  }),
            ])
      } catch ({ message }: any) {
            return next(
                  Boom.badData(message as string)
            )
      }
}

/** Update user account details */
const logout = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            /** Get current user */
            let userObj: any = Object.assign({}, req.user)
            let maxDevices = [];
            let pushTokens = [];
            /** Logout from specific device */
            if (req.body.deviceId) {
                  maxDevices = userObj.maxDevices?.filter(
                        item => item !== req.body.deviceId
                  )
                  pushTokens = userObj.pushTokens?.filter(
                        item => item.deviceId !== req.body.deviceId
                  );
            }

            await usersService.updateUser(
                  { _id: userObj._id },
                  { maxDevices, pushTokens }
            )
            res.status(200).send({
                  message: authControllerResponse.userLogoutSuccess
            })
      } catch ({ message }: any) {
            return next(Boom.badData(message as string))
      }
}

const updateHandout = async (
      req: Request | any,
      res: Response,
      next: NextFunction
) => {
      try {
            const smallGroup = await smallGroupService
                  .getSmallGroupForHandout({
                        _id: req.params.smallGroup
                  })
            if (!smallGroup) {
                  /** Return status code 404 not found */
                  return next(
                        Boom.notFound(
                              smallGroupControllerResponse.getSmallGroupFailure
                        )
                  )
            }
            req.body.question = Number(req?.body?.question) >= 0
                  ? Number(req.body.question)
                  : -1
            const {
                  question,
                  answer
            }: {
                  question: number,
                  answer: string
            } = req.body;
            if (
                  !smallGroup?.questions?.length
                  ||
                  !smallGroup?.questions[question]
            ) {
                  return res.status(200).send({
                        message: handoutsControllerResponse.updateHandoutSuccess
                  })
            }

            const handout = await handoutsService
                  .getHandout({
                        user: req.user._id,
                        smallGroup: smallGroup._id
                  });
            let query = {
                  user: req.user._id,
                  smallGroup: smallGroup._id
            };
            let body: any = {
                  answers: [{ answer, question }]
            };

            let ans = handout?.answers?.find(i => i.question === question)
            if (handout && !ans) {
                  body = {
                        '$push': {
                              'answers': {
                                    answer,
                                    question
                              }
                        }
                  }
            }
            else if (ans) {
                  body = {
                        '$set': {
                              'answers.$.answer': answer
                        }
                  }
                  query['answers.question'] = question
            }

            await handoutsService.updateHandout(query, body);
            res.status(200).send({
                  message: handoutsControllerResponse.updateHandoutSuccess
            })
      } catch (e: any) {
            next(Boom.badData(e.message))
      }
}

export {
      logout,
      getCoupon,
      emailAuth,
      deleteUser,
      submitQuery,
      blessFriend,
      updateRating,
      paymentSheet,
      subscribePlan,
      updateHandout,
      submitFeedback,
      getUserAccount,
      getBlessFriend,
      changePassword,
      getUserLibrary,
      getEncodeImage,
      verifyEmailAuth,
      updateUserAccount,
      updateUserLibrary,
      getUserSubscription,
      getChangePasswordCode,
      getShareOptionImageUrl,
}
