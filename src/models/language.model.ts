import mongoose, { Schema } from "mongoose";

export interface ILanguage extends mongoose.Document {
  name: string;
  code: string;
}

export const LanguageSchema = new Schema<ILanguage>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
  },
  { strict: "throw" }
);

export const LanguageModel = mongoose.model<ILanguage>(
  "Language",
  LanguageSchema
);
