import { ReadsOfDayModel } from '../models/index'

/**
 * Initialize readsOfDays  by machine user
*/
(async () => {
    try {
        /** Find readsOfDays */
        const readsOfDays = await ReadsOfDayModel
            .find({})
            .select('_id')
            .lean()
            .exec()

        if (!readsOfDays?.length) {
            console.log('ReadsOfDays is empty')
            return false;
        }
        await Promise.all(readsOfDays.map(async item => {
            await ReadsOfDayModel.findOneAndUpdate(
                { _id: item._id },
                { contentType: 'Normal', updatedAt: new Date() },
                { upsert: true }
            )

            console.log('readsOfDaysId: ', item._id)
        }))

        console.log('Reads Of Days set content type successfully')
    } catch ({ message }: any) {
        console.log(
            'Reads Of Days set content type  script execution failed: Error: ',
            message
        )
    }
    return true;
})();
