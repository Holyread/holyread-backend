import { DailyDvotionalModel } from '../models/index'

// Initialize small group published  by machine user
(async () => {
    try {

        let start = new Date();
        let end = new Date();
        let filter: any = {};
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        filter = { displayAt: { $lte: end } };
        /** Find smallGroup */
        const daily_devotional = await DailyDvotionalModel
            .find(filter)
            .select('_id displayAt')
            .lean()
            .exec()

        if (!daily_devotional?.length) {
            console.log('Daily devotional is empty')
            return false;
        }
        await Promise.all(daily_devotional.map(async item => {
            await DailyDvotionalModel.findOneAndUpdate(
                { _id: item._id },
                { publish: true, publishedAt: item.displayAt, updatedAt: new Date() },
                { upsert: true }
            )

            console.log('devotionalId: ', item._id)
        }))

        console.log('Daily devotional published successfully')
    } catch ({ message }: any) {
        console.log(
            'Daily devotional published  script execution failed: Error: ',
            message
        )
    }
    return true;
})();
