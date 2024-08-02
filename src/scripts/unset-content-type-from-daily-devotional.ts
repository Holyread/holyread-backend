import { DailyDvotionalModel } from '../models/index'

// Initialize small group published  by machine user
(async () => {
    try {
        /** Find smallGroup */
        const daily_devotional = await DailyDvotionalModel
            .find({})
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
                { $unset: { contentType: '' }, updatedAt: new Date() },
                { upsert: true }
            )

            console.log('dailyDevotionalId: ', item._id)
        }))

        console.log('Daily Devotional content type remove successfully')
    } catch ({ message }: any) {
        console.log(
            'Daily Devotional content type remove  script execution failed: Error: ',
            message
        )
    }
    return true;
})();
