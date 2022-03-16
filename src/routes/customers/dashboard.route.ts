import express, { Router } from 'express'
import {
  getCategories,
  getCuratedsList,
  getLatestBooks,
  getPopularBooks,
  getReadsOfTheDay,
  getRecentReads,
  getRecommendedBooks,
  getSmallGroups
} from '../../controllers/customers/dashboard.controller'

import customerPassport from '../../middleware/customers.passport'

const router: Router = express.Router()

router.get('/categories', customerPassport, getCategories)
router.get('/curateds', customerPassport, getCuratedsList)
router.get('/latest-books', customerPassport, getLatestBooks)
router.get('/popular-books', customerPassport, getPopularBooks)
router.get('/reads-of-the-day', customerPassport, getReadsOfTheDay)
router.get('/recent-reads', customerPassport, getRecentReads)
router.get('/recommended-books', customerPassport, getRecommendedBooks)
router.get('/small-groups', customerPassport, getSmallGroups)
export default router
