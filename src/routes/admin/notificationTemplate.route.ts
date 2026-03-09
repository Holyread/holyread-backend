import { Router } from "express";
import { validate } from "../../middleware/validation";
import {
  createNotificationTemplateSchema,
  updateNotificationTemplateSchema,
  deleteNotificationTemplateSchema,
  getNotificationTemplateSchema,
} from "../../validation/index";
import {
  createNotificationTemplate,
  deleteNotificationTemplate,
  getAllNotificationTemplate,
  getNotificationTemplateDetailById,
  updateNotificationTemplate,
} from "../../controllers/admin/notificationTemplate.controller";

const router: Router = Router();
router.get(
  "/",
  validate(getNotificationTemplateSchema),
  getAllNotificationTemplate,
);
router.get(
  "/:id",
  validate(getNotificationTemplateSchema),
  getNotificationTemplateDetailById,
);
router.post(
  "/",
  validate(createNotificationTemplateSchema),
  createNotificationTemplate,
);
router.patch(
  "/:id",
  validate(updateNotificationTemplateSchema),
  updateNotificationTemplate,
);
router.delete(
  "/:id",
  validate(deleteNotificationTemplateSchema),
  deleteNotificationTemplate,
);

export default router;
