import * as z from "zod";
import type { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";

type ValidatedData = {
  body?: Record<string, any>;
  params?: Record<string, any>;
  query?: Record<string, any>;
};

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.error.issues.map((issue) => issue.message),
        });
        return;
      }

      const data = result.data as ValidatedData;

      if (data.body) req.body = data.body;
      if (data.params) req.params = data.params as Request["params"];
      if (data.query) req.query = data.query as Request["query"];

      next();
    } catch (error: any) {
      next(Boom.badData(error.message));
    }
  };
};
