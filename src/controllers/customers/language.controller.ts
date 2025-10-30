import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";
import languageService from "../../services/admin/language/language.service";

const getAllLanguages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const language = await languageService.getLanguage({});
    res.status(200).send({
      message: "All languages fetched successfully",
      data: language
    });
  } catch (e: any) {
    next(Boom.badData(e.message));
  }
}

export default {
  getAllLanguages
}