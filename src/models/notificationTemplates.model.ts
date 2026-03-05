import mongoose, { Schema } from "mongoose";
import { NOTIFICATION_TEMPLATE } from "../constants/notificationTemplate.constant";

export interface INotificationTemplate extends mongoose.Document {
  type: string;
  title: string;
  description: string;
  language: { type: Schema.Types.ObjectId; ref: "language" };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TEMPLATE),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    language: {
      type: Schema.Types.ObjectId,
      ref: "language",
      required: true,
    },
  },
  { timestamps: true },
);

NotificationTemplateSchema.index({ type: 1, language: 1 }, { unique: true });

export const NotificationTemplateModel = mongoose.model<INotificationTemplate>(
  "NotificationTemplate",
  NotificationTemplateSchema,
);
