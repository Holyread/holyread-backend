import { TransactionsModel } from '../../../models/index'

/** Get transaction by filter */
const getAllTransactions = async (skip: number, limit: number, search: any, sort) => {
      try {
            let result: any = await TransactionsModel.find(search).select('planCreatedAt planExpiredAt latestInvoice userId total status paymentMethod reason paymentLink createdAt').populate({ path: 'userId', select: 'email inAppSubscription subscription', populate: { path: 'subscription', select: 'duration title saves' }}).skip(skip).limit(limit).sort(sort).lean().exec()
            const count: any = await TransactionsModel.count(search).lean().exec()

            const formattedDate = (date: Date) => {
                  return date.toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                  }).replace(/ /g, ' ')
            };
            result = result.map((i, index) => {
                  return {
                        email: i.userId.email,
                        date: formattedDate(i?.createdAt),
                        planCreatedAt: formattedDate(i?.planCreatedAt),
                        planExpiredAt: formattedDate(i?.planExpiredAt),
                        total: i.total,
                        status: i?.status,
                        paymentLink: i?.paymentLink,
                        payment: ['fa-cc-' + i?.paymentMethod?.brand?.toLowerCase(), i?.paymentMethod?.brand || ''],
                        index,
                        reason: i.reason,
                        latestInvoice: i.latestInvoice || 'in_' + i?.userId?.inAppSubscription?.transactionId,
                        subscription: i?.userId?.subscription
                  }
            })

            return { count, transactions: result }
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllTransactions
}
