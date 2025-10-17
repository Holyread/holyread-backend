import express, { Router } from 'express'
import languageController from '../../controllers/customers/language.controller'
const { getAllLanguages } = languageController

const router: Router = express.Router()

router.get('/', getAllLanguages)

export default router