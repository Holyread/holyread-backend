import { FilterQuery } from "mongoose";
import { NotificationTemplateModel } from "../../../models";
import { INotificationTemplate } from "../../../models/notificationTemplates.model";

export const createNotificationTemplateInDB = async (
  data: Partial<INotificationTemplate>,
) => {
  return await NotificationTemplateModel.create(data);
};

export const updateNotificationTemplateInDB = async (
  id: string,
  data: Partial<INotificationTemplate>,
) => {
  return await NotificationTemplateModel.findOneAndUpdate(
    { _id: id },
    { $set: data },
    { new: true },
  );
};

export const getNotificationTemplateFromDB = async (
  query: FilterQuery<INotificationTemplate>,
) => {
  return await NotificationTemplateModel.findOne(query);
};

export const getAllNotificationTemplatesFromDB = async (
  query: FilterQuery<INotificationTemplate>,
) => {
  return await NotificationTemplateModel.find(query);
};

export const deleteNotificationTemplateFromDB = async (id: string) => {
  return await NotificationTemplateModel.findOneAndDelete({ _id: id });
};
