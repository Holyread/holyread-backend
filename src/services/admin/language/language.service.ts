import { LanguageModel } from "../../../models/language.model";
import { Types } from "mongoose";

const languageCache : Record<string, Types.ObjectId> = {}

const getLanguageCache = async (code: string) => {
  if (!code) throw new Error("Language code is required");
  if (languageCache[code]) return languageCache[code];

  const language = await LanguageModel.findOne({ code });

  if (!language) throw new Error(`Invalid language code: ${code}`);

  languageCache[code] = language._id as Types.ObjectId;
  return language._id;
};

const createLanguage = async (body: any) => {
  const result = await LanguageModel.create(body);
  return result;
};

const getLanguage = async (body: any) => {
  const result = await LanguageModel.find(body).select("name code");
  return result;
};

const updateLanguage = async (body: any) => {
  const result = await LanguageModel.findByIdAndUpdate(body._id, body, {
    new: true,
  });
  return result;
};

const deleteLanguage = async (body: any) => {
  const result = await LanguageModel.findByIdAndDelete(body._id);
  return result;
};

export default {
  getLanguageCache,
  createLanguage,
  getLanguage,
  updateLanguage,
  deleteLanguage,
};
