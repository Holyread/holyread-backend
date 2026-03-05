import * as z from "zod";
import { NOTIFICATION_TEMPLATE } from "../constants/notification.constant";

const mongoId = z.string().regex(/^[a-fA-F0-9]{24}$/, {
  message: "Invalid MongoDB ObjectId",
});

export const notificationTemplateTypeSchema = z.enum(
  Object.values(NOTIFICATION_TEMPLATE) as [string, ...string[]],
);

export const createNotificationTemplateSchema = z.object({
  body: z.object({
    type: notificationTemplateTypeSchema,
    title: z.string().min(2),
    description: z.string().min(2),
    language: z.string(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateNotificationTemplateSchema = z.object({
  body: z
    .object({
      type: notificationTemplateTypeSchema.optional(),
      title: z.string().min(2).optional(),
      description: z.string().min(2).optional(),
      language: z.string().optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
      message: "At least one field must be provided",
    }),
  params: z.object({
    id: mongoId, // ← validates :id exists in URL
  }),
  query: z.object({}).optional(),
});

export const deleteNotificationTemplateSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
});

export const getNotificationTemplateSchema = z.object({
  params: z.object({
    id: mongoId.optional(),
  }),
  query: z.object({
    type: notificationTemplateTypeSchema.optional(),
  }),
});
