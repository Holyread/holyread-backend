import mongoose, { Schema } from "mongoose";

export interface IDevotionalCategory extends mongoose.Document {
  name: string;
  image: string;
  description: string;
  status?: "Active" | "Deactive";
  language: { type: Schema.Types.ObjectId; ref: "language" };
}

export const DevotionalCategorySchema = new Schema(
  {
    name: { type: String, required: true, index: true, unique: true },
    image: { type: String, required: true },
    description: { type: String },
    status: { type: String, index: true, default: "Active" },
    language: { type: Schema.Types.ObjectId, ref: "language", index: true },
  },
  { strict: "throw", timestamps: true }
);

export const DevotionalCategoryModel = mongoose.model<IDevotionalCategory>(
  "devotionalCategory",
  DevotionalCategorySchema
);
