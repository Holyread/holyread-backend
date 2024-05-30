import { DailyDvotionalModel } from '../models/index'

// Initialize small group published  by machine user
(async () => {
    try {
        /** Find smallGroup */
        const daily_devotional = await DailyDvotionalModel
            .find()
            .select('_id')
            .lean()
            .exec()

        if (!daily_devotional?.length) {
            console.log('Daily devotional is empty')
            return false;
        }
        await Promise.all(daily_devotional.map(async item => {
            await DailyDvotionalModel.findOneAndUpdate(
                { _id: item._id },
                { $unset: { displayAt: '' }, updatedAt: new Date() },
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
