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

    if (!code) return next(Boom.badData("Language code is required"));

    const languageId = await languageService.getLanguageCache(code);

    (req as any).languageId = languageId;
    req.body.language = languageId;
    next();
  } catch (error: any) {
    next(Boom.badData(error.message));
  }
};
