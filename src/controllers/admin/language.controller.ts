import { Request, Response, NextFunction } from "express";
import languageService from "../../services/admin/language/language.service";
import Boom from "@hapi/boom";
import { responseMessage } from "../../constants/message.constant";

const languageControllerResponse = responseMessage.languageControllerResponse;

const createLanguage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.code)
      return next(
        Boom.badData(languageControllerResponse.createLanguageFailure)
      );
    const result = await languageService.createLanguage(req.body);
    res.status(200).send({
      message: languageControllerResponse.createLanguageSuccess,
      data: result,
    });
  } catch (error: any) {
    next(Boom.badData(error.message));
  }
};

const getLanguage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await languageService.getLanguage(req.body);
    res.status(200).send({
      message: languageControllerResponse.getLanguageSuccess,
      data: result,
    });
  } catch (error: any) {
    next(Boom.badData(error.message));
  }
};

const updateLanguage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await languageService.updateLanguage(req.body);
    res.status(200).send({
      message: languageControllerResponse.updateLanguageSuccess,
      data: result,
    });
  } catch (error: any) {
    next(Boom.badData(error.message));
  }
};

const deleteLanguage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await languageService.deleteLanguage(req.body);
    res.status(200).send({
      message: languageControllerResponse.deleteLanguageSuccess,
      data: result,
    });
  } catch (error: any) {
    next(Boom.badData(error.message));
  }
};

export default {
  createLanguage,
  getLanguage,
  updateLanguage,
  deleteLanguage,
};
