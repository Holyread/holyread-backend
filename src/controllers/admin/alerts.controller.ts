import { NextFunction, Request, Response } from 'express';
import Boom from '@hapi/boom';
import { fetchAlerts } from "../../services/admin/alerts/alerts.service";

export const fetchPipelineAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, page, limit, sortBy, sortOrder } = req.query;
    const result = await fetchAlerts({
      type: type as string,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.status(200).send({
      message: 'Fetched PipelineAlerts Successfully',
      data:result
    });
  } catch (e: any) {
    next(Boom.badData(e.message));
  }
};
