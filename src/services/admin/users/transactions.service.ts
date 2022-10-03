import { sortArrayObject } from '../../../lib/utils/utils';
import { TransactionsModel } from '../../../models/index'

/** Get transaction by filter */
const getAllTransactions = async (skip: number, limit: number, search: any, sort: any) => {
      try {
            let result: any = await TransactionsModel
                  .find({})
                  .select(
                        'latestInvoice userId total status paymentMethod reason paymentLink createdAt customer amount account device'
                  )
                  .populate({
                        path: 'userId',
                        select: 'email inAppSubscription subscription',
                        populate: { path: 'subscription', select: 'duration title saves price' }
                  })
                  .lean()
                  .exec();

            const formattedDate = (date: Date) => {
                  return date.toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                  }).replace(/ /g, ' ')
            };
            let transactions: any = new Set()
            result.map((i, index) => {
                  /** return if date not in range */
                  if (
                        search.from &&
                        search.to &&
                        (
                              new Date(i.createdAt).getTime() < search.from ||
                              new Date(i.createdAt).getTime() > search.to
                        )
                  )     { return null }
                  /** return if date less then start */
                  if (
                        search.from &&
                        !search.to &&
                        new Date(i.createdAt).getTime() < search.from
                  )     { return null }
                  /** return if date grater then end */
                  if (
                        !search.from &&
                        search.to &&
                        new Date(i.createdAt).getTime() > search.to
                  )     { return null }
                  const shipping = i?.customer?.shipping?.address
                  const data = {
                        _id: i._id,
                        email: i.userId.email,
                        date: formattedDate(i?.createdAt),
                        status: i?.status,
                        paymentLink: i?.paymentLink,
                        payment: i?.device === 'app' ? ['fa fa-mobile', 'InApp'] : ['fa-cc-' + i?.paymentMethod?.brand?.toLowerCase(), i?.paymentMethod?.brand || ''],
                        reason: i.reason,
                        latestInvoice: i.latestInvoice || 'in_' + (i?.userId?.inAppSubscription?.transactionId || i._id),
                        subscription: i?.userId?.subscription,
                        price: i?.userId?.subscription?.price,
                        account: i.account,
                        customer: { ...i.customer, shipping: shipping && shipping?.line1 + ' ,' + shipping?.country + ' ' + shipping?.postal_code },
                        subTotal: i?.amount?.subtotal || 0,
                        tax: i?.amount?.tax || 0,
                        total: i?.amount?.total || i.total,
                        device: i?.device
                  }
                  /** Replace negetive total to zero */
                  data.total = Number(data.total) < 0 ? 0.00 : Number(data.total)
                  data.subTotal = data.subTotal < 0 ? 0.00 : data.subTotal
                  /** Match search criteria with some fileds */
                  if (
                        search.keyword &&
                        !data?.status?.toLowerCase()?.includes(search.keyword) &&
                        !data?.email?.toLowerCase()?.includes(search.keyword) &&
                        Math.trunc(data?.total) != search.keyword
                  )     { return null }
                  transactions.add(data)
            })
            transactions = [...transactions].filter(i => i)
            /** sort by column */
            transactions = sortArrayObject(transactions, sort[0][0], (sort[0][1]).toLowerCase())
            const count = transactions.length;
            transactions = transactions.slice(skip, skip + limit)
            return { count, transactions: [...transactions] }
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllTransactions
}
