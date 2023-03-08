import { UserModel, TransactionsModel } from '../models/index'

/** Set last transaction id */
(async () => {
      try {
            const users = await UserModel.find({ lastTrnId: { $exists: false } });
            await Promise.all(users.map(async user => {
                  const transaction = await TransactionsModel.findOne({
                        userId: user._id.toString()
                  });
                  if (transaction?._id) {
                        user.lastTrnId = transaction._id.toString();
                        user.save()
                  }
            }))

            console.log('Set last transaction id script executed successfully');

      } catch (e: any) {
            console.log(
                  'Set last transaction id script execution failed, Error is: ', e
            )
      }
      return true;
})();
