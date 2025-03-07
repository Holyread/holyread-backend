import mongoose, { Schema } from "mongoose";

mongoose.set("autoIndex", true);

export interface IDonation extends mongoose.Document {
  userId: string;
  amount: number;
  paymentIntentId: string;
  status: string;
}

export type createDonationType = {
  userId: string;
  amount: number;
  paymentIntentId: string;
  status: string;
};

export type getDonationType = {
  userId: string;
  amount: number;
  paymentIntentId: string;
  status: string;
};

export const DonationSchema = new Schema(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentIntentId: { type: String, required: true },
    status: { type: String, default: "pending" },
    createdAt: { type: Date, default: Date.now },
  },
  { strict: "throw" }
);

export const DonationModel = mongoose.model<IDonation>(
  "donation",
  DonationSchema
);
