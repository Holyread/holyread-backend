import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";
import languageService from "../services/admin/language/language.service";

export const languageMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const code = (req.body.language ||
      req.query.language ||
      req.params.language || "en") as string;

    const languageId = await languageService.getLanguageCache(code);

    req.languageId = languageId;
    next();
    
  } catch (error: any) {
    next(Boom.badData(error.message));
  }
};
