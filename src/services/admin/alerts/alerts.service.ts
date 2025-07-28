import { formattedDate } from './../../../lib/utils/utils';
import { AlertsModel } from '../../../models/alerts.model';

interface AlertQueryOptions {
  type?: string; //  'devotional', 'summary', 'curatedPosts', 'combined'
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const fetchAlerts = async (options: AlertQueryOptions = {}) => {
  const {
    type,
    page = 1,
    limit = 10,
    sortBy = 'triggeredAt',
    sortOrder = 'desc',
  } = options;

  const query: any = {};
  if (type) query.type = type;

  const skip = (page - 1) * limit;

  const alerts = await AlertsModel.find(query)
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await AlertsModel.countDocuments(query);

  const formattedData = alerts.map((alert) => ({
    ...alert,
    triggeredDate: formattedDate(alert.triggeredAt).replace(/ /g, ' '),
  }));
  
  return {
    data: formattedData,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
