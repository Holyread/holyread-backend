import express, { Router } from 'express'
import languageController from '../../controllers/admin/language.controller'
const { createLanguage, getLanguage, updateLanguage, deleteLanguage } = languageController

const router: Router = express.Router()

router.post('/', createLanguage)
router.get('/', getLanguage)
router.put('/', updateLanguage)
router.delete('/', deleteLanguage)

export default router