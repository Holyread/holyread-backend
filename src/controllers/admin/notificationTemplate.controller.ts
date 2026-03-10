import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";
import {
  createNotificationTemplateInDB,
  updateNotificationTemplateInDB,
  deleteNotificationTemplateFromDB,
  fetchAllNoificationTemplates,
  fetchNotiTemplateById,
} from "../../services/admin/notificationTemplate/notificationTemplate.service";
import { responseMessage } from "../../constants/message.constant";

const { notificationTemplateControllerResponse } = responseMessage;

export const getAllNotificationTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const notificationTemplates = await fetchAllNoificationTemplates({});

    res.status(200).json({
      message:
        notificationTemplateControllerResponse.getNotificationTemplatesSuccess,
      data: notificationTemplates,
    });
  } catch (e: any) {
    next(Boom.badData(e.message));
  }
};

export const getNotificationTemplateDetailById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, type } = req.params;
    const filter: Record<string, any> = {};

    if (id) filter._id = id;
    if (type) filter.type = type;

    const notficationTemplate = await fetchNotiTemplateById(filter);

    res.status(200).json({
      message:
        notificationTemplateControllerResponse.getNotificationTemplateSuccess,
      data: notficationTemplate,
    });
  } catch (e: any) {
    next(Boom.badData(e.message));
  }
};

export const createNotificationTemplate = async (
  req: Request & { languageId?: string },
  res: Response,
  next: NextFunction,
) => {
  try {
    const { type, title, description } = req.body;
    const language = req.languageId;

    if (!type || !title || !description || !language) {
      return next(Boom.badData("All fields are required"));
    }

    const notificationTemplate = await createNotificationTemplateInDB(
      {
        type,
        title,
        description,
        language,
      },
    );
    
    res.status(201).json({
      message:
        notificationTemplateControllerResponse.createNotificationTemplateSuccess,
      data: notificationTemplate,
    });
  } catch (e: any) {
    next(Boom.badData(e.message));
  }
};

export const updateNotificationTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { title, description, language } = req.body;

    const update = await updateNotificationTemplateInDB(id as string, {
      title,
      description,
      language,
    });

    res.status(200).json({
      message:
        notificationTemplateControllerResponse.updateNotificationTemplate,
      data: update,
    });
  } catch (error: any) {
    next(Boom.badData(error.message));
  }
};

export const deleteNotificationTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const deleteNotificationTemplate = await deleteNotificationTemplateFromDB(
      id as string,
    );

    res.status(200).json({
      message:
        notificationTemplateControllerResponse.deleteNotificationTemplate,
      data: deleteNotificationTemplate,
    });
  } catch (error: any) {
    next(Boom.badData(error.message));
  }
};
