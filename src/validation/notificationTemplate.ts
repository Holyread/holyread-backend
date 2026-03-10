import * as z from "zod";
import { NOTIFICATION_TEMPLATE } from "../constants/notificationTemplate.constant";

const mongoId = z.string().regex(/^[a-fA-F0-9]{24}$/, {
  message: "Invalid MongoDB ObjectId",
});

export const notificationTemplateTypeSchema = z.enum(
  Object.values(NOTIFICATION_TEMPLATE) as [string, ...string[]],
  {
    error: (issue) => {
      if (issue.input === undefined || issue.input === null) {
        return { message: "Notification template type is required" };
      }
      return { message: "Invalid notification template type" };
    },
  },
);

export const createNotificationTemplateSchema = z.object({
  body: z.object({
    type: notificationTemplateTypeSchema,
    title: z
      .string({ message: "Title is required" })
      .min(2, { message: "Title must be at least 2 characters long" }),
    description: z
      .string({ message: "Description is required" })
      .min(2, { message: "Description must be at least 2 characters long" }),
    language: z
      .string()
      .min(2, { message: "Language must be at least 2 characters long" }),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateNotificationTemplateSchema = z.object({
  body: z
    .object({
      type: notificationTemplateTypeSchema.optional(),
      title: z
        .string()
        .min(2, { message: "Title must be at least 2 characters long" })
        .optional(),
      description: z
        .string()
        .min(2, { message: "Description must be at least 2 characters long" })
        .optional(),
      language: z
        .string()
        .min(2, { message: "Language must be at least 2 characters long" })
        .optional(),
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
