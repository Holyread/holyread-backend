import express, { Router } from 'express'
import {
  getCategories,
  getCuratedsList,
  getLatestBooks,
  getPopularBooks,
  getDailyDevotional,
  getRecentReads,
  getRecommendedBooks,
  getSmallGroups,
  getFavoriteCategoriesBooks,
} from '../../controllers/customers/dashboard.controller'

const router: Router = express.Router()

router.get('/categories', getCategories)
router.get('/curateds', getCuratedsList)
router.get('/latest-books', getLatestBooks)
router.get('/popular-books', getPopularBooks)
router.get('/reads-of-the-day', getDailyDevotional)
router.get('/recent-reads', getRecentReads)
router.get('/recommended-books', getRecommendedBooks)
router.get('/small-groups', getSmallGroups)
router.get('/favorite-categories', getFavoriteCategoriesBooks)
export default router
