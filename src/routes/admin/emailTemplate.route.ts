import express, { Router } from 'express'
import {
  addEmailTemplate,
  deleteEmailTemplate,
  getAllEmailTemplates,
  getOneEmailTemplate,
  updateEmailTemplate
} from '../../controllers/admin/emailTemplate.controller'

const router: Router = express.Router()

router.post('/', addEmailTemplate)
router.get('/:id', getOneEmailTemplate)
router.get('/', getAllEmailTemplates)
router.put('/:id', updateEmailTemplate)
router.delete('/:id', deleteEmailTemplate)

export default router
