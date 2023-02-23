import { formattedDate, getDates, sortArrayObject } from '../../../lib/utils/utils';
import { TransactionsModel } from '../../../models/index'

/** Get transaction by filter */
const getAllTransactions = async (
      skip: number,
      limit: number,
      search: any,
      sort: any
) => {
      try {
            let result: any = await TransactionsModel
                  .find({})
                  .select([
                        'total',
                        'userId',
                        'status',
                        'reason',
                        'device',
                        'amount',
                        'account',
                        'customer',
                        'createdAt',
                        'paymentLink',
                        'latestInvoice',
                        'paymentMethod',
                  ])
                  .populate({
                        path: 'userId',
                        select: [
                              'email',
                              'inAppSubscription',
                              'subscription'
                        ],
                        populate: {
                              path: 'subscription',
                              select: 'duration title saves price'
                        }
                  })
                  .lean()
                  .exec();

            let transactions: any = new Set()
            result.map((i, index) => {
                  if (!i?.userId?.email) return;

                  /** return if date not in range */
                  if (
                        search.from &&
                        search.to &&
                        (
                              new Date(i.createdAt).getTime() < search.from ||
                              new Date(i.createdAt).getTime() > search.to
                        )
                  ) { return null }
                  /** return if date less then start */
                  if (
                        search.from &&
                        !search.to &&
                        new Date(i.createdAt).getTime() < search.from
                  ) { return null }
                  /** return if date grater then end */
                  if (
                        !search.from &&
                        search.to &&
                        new Date(i.createdAt).getTime() > search.to
                  ) { return null }
                  const shipping = i?.customer?.shipping?.address
                  const data = {
                        _id: i._id,
                        email: i.userId?.email,
                        date: formattedDate(i?.createdAt)?.replace(/ /g, ' '),
                        createdAt: i?.createdAt,
                        status: i?.status,
                        paymentLink: i?.paymentLink,
                        payment: i?.device === 'app' ? ['fa fa-mobile', 'In-App' + i?.inAppSubscription?.purchaseToken ? ' (Android)' : ' (IOS)'] : ['fa-cc-' + i?.paymentMethod?.brand?.toLowerCase(), i?.paymentMethod?.brand || ''],
                        reason: i.reason,
                        latestInvoice: i.latestInvoice || 'in_' + i._id,
                        subscription: i?.userId?.subscription,
                        price: i?.userId?.subscription?.price,
                        account: i.account,
                        customer: {
                              ...i.customer,
                              shipping: shipping && shipping?.line1 + ' ,' + shipping?.country + ' ' + shipping?.postal_code
                        },
                        subTotal: i?.amount?.subtotal || 0,
                        tax: i?.amount?.tax || 0,
                        total: i?.amount?.total || i.total,
                        discount: i?.amount?.discount || 0,
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
                  ) { return null }
                  transactions.add(data)
            })
            transactions = [...transactions].filter(i => i)
            /** sort by column */
            transactions = sortArrayObject(
                  transactions,
                  sort[0][0] === 'date' ? 'createdAt' : sort[0][0],
                  (sort[0][1]).toLowerCase()
            )
            const count = transactions.length;
            transactions = transactions.slice(skip, skip + limit)
            return { count, transactions: [...transactions] }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get user analytics */
const getUserAnalytics = async (duration = 'year') => {
      try {
            let now = new Date();
            switch (duration) {
                  case 'year':
                        now.setMonth(now.getMonth() - 12);
                        break;
                  case 'month':
                        now.setMonth(now.getMonth() - 1);
                        break;
                  default:
                        now.setDate(now.getDate() - 7);
                        break;
            }
            now.setHours(0, 0, 0, 0);
            now.setDate(now.getDate() + 1);

            let transactions: any = await TransactionsModel
                  .find({ userId: { $exists: true }, createdAt: { $gt: now }, status: { $in: ['active', 'subscribed', 'did_renew'] } })
                  .select(
                        'userId total status createdAt amount device'
                  )
                  .sort([['createdAt', 'ASC']])
                  .lean()
                  .exec();

            const today = new Date();
            today.setHours(23, 59, 59, 999);
            const dates = getDates(now, today);
            let
                  users: any = [],
                  plans: any = [],
                  titles = new Set(),
                  totalUsers = 0,
                  totalPlans = 0,
                  totalRevenue = 0;

            let revenues = [];

            dates.map((i) => {
                  const iTransactions =
                        transactions
                              .filter(j =>
                                    new Date(j.createdAt).setHours(0, 0, 0, 0) === new Date(i).setHours(0, 0, 0, 0)
                              );

                  let plan = 0;
                  let revenue = 0;
                  const user = new Set();

                  while (iTransactions.length) {
                        const first: any = iTransactions?.splice(0, 1)[0]
                        user.add(first?.userId);
                        plan++;
                        if (first.total && first.status == 'active') {
                              revenue += first.total;
                        }
                        totalUsers++;
                  }
                  totalPlans += plan;
                  plans.push(plan);
                  totalRevenue += revenue;
                  revenues.push(revenue.toFixed(2));
                  titles.add(
                        formattedDate(i, {
                              day: 'numeric',
                              month: 'numeric',
                              year: 'numeric'
                        }).replace(/ /g, '/')
                  );
                  users.push([...user].length);
            })
            return {
                  plans,
                  users,
                  totalPlans,
                  totalUsers,
                  totalRevenue: totalRevenue.toFixed(2),
                  titles: [...titles],
                  revenues: [...revenues],
            }
      } catch (e: any) {
            throw new Error(e)
      }
}

const getTransaction = async (query: object) => {
      try {
            const transaction = await TransactionsModel.findOne(query).sort([['createdAt', 'DESC']]).lean().exec();
            return transaction;
      } catch ({ message }) {
            return {}
      }
}

/** Delete user transactions */
const deleteTransaction = async (query: Object) => {
      try {
            await TransactionsModel.deleteMany(query)
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getTransaction,
      getUserAnalytics,
      deleteTransaction,
      getAllTransactions,
}
