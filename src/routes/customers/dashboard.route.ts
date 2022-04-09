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

const router: Router = express.Router()

router.get('/categories', getCategories)
router.get('/curateds', getCuratedsList)
router.get('/latest-books', getLatestBooks)
router.get('/popular-books', getPopularBooks)
router.get('/reads-of-the-day', getReadsOfTheDay)
router.get('/recent-reads', getRecentReads)
router.get('/recommended-books', getRecommendedBooks)
router.get('/small-groups', getSmallGroups)
export default router
