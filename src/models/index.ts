import mongoose from 'mongoose'
import config from '../../config'
import { CmsModel } from './cms.model'
import { FaqModel } from './faq.model'

import { UserModel } from './user.model'

import { RatingModel } from './rating.model'

import { CouponsModel } from './coupons.model'
import { RevenueModel } from './revenue.model'
import { SettingModel } from './setting.model'
import { HandoutsModel } from './handouts.model'

import { BookAuthorModel } from './bookAuthor.model'
import { ShareImageModel } from './shareImage.model'
import { ReadsOfDayModel } from './readsOfDay.model'
import { SmallGroupModel } from './smallGroup.model'
import { HighLightsModel } from './highLights.model'

import { UserLibraryModel } from './userLibrary.model'
import { BookSummaryModel } from './bookSummary.model'
import { TestimonialModel } from './testimonial.model'

import { BookCategoryModel } from './bookCategory.model'
import { TransactionsModel } from './transactions.model'

import { SubscriptionsModel } from './subscription.model'
import { ExpertCuratedModel } from './expertCurated.model'
import { EmailTemplateModel } from './emailTemplate.model'
import { NotificationsModel } from './notifications.model'

import { RecommendedBookModel } from './recommendedBooks.model'
import { InAppNotificationModel } from './inAppNotification.model'

const NODE_ENV = config.NODE_ENV
const option = { useNewUrlParser: true, useUnifiedTopology: true }

mongoose.Promise = global.Promise

// Dont connect to real db when running test configuration
if (NODE_ENV !== 'test') {
  mongoose
    .connect(config.DBURL, option)
    .then(
      async result =>
        console.log('DB connected successfully')
    )
    .catch(
      err => console.error('Error while connecting DB', err)
    )
}

export {
  mongoose,
  CmsModel,
  FaqModel,
  UserModel,
  RatingModel,
  SettingModel,
  RevenueModel,
  CouponsModel,
  HandoutsModel,
  ShareImageModel,
  ReadsOfDayModel,
  SmallGroupModel,
  HighLightsModel,
  BookAuthorModel,
  TestimonialModel,
  UserLibraryModel,
  BookSummaryModel,
  BookCategoryModel,
  TransactionsModel,
  SubscriptionsModel,
  ExpertCuratedModel,
  EmailTemplateModel,
  NotificationsModel,
  RecommendedBookModel,
  InAppNotificationModel
}
