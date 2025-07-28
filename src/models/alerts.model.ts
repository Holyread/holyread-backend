import mongoose, { Schema } from 'mongoose';

mongoose.set('autoIndex', true);

export interface IAlert extends mongoose.Document {
  type: 'devotional' | 'summary' | 'curatedPosts'| 'combined';
  devotionalCount: number;
  summaryCount: number;
  curatedPostsCount: number;
  alertMessage: string;
  triggeredAt: Date;
  emailSent: boolean;
}

const AlertSchema = new Schema<IAlert>(
  {
    type: {
      type: String,
      enum: ['devotional', 'summary', 'curatedPosts', 'combined'],
      required: true,
    },
    devotionalCount: {
      type: Number,
      default: 0,
    },
    summaryCount: {
      type: Number,
      default: 0,
    },
    curatedPostsCount: {
      type: Number,
      default: 0,
    },
    alertMessage: {
      type: String,
      required: true,
    },
    triggeredAt: {
      type: Date,
      required: true,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const AlertsModel = mongoose.model<IAlert>('Alert', AlertSchema);
