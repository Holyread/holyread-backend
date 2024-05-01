import { SmallGroupModel } from '../models/index'

// Initialize small group published  by machine user
(async () => {
    try {
        /** Find smallGroup */
        const small_group = await SmallGroupModel
            .find({})
            .select('_id')
            .lean()
            .exec()

        if (!small_group?.length) {
            console.log('Books store is empty')
            return false;
        }
        await Promise.all(small_group.map(async item => {
            await SmallGroupModel.findOneAndUpdate(
                { _id: item._id },
                { publish: true, updatedAt: new Date() },
                { upsert: true }
            )

            console.log('smallGroupId: ', item._id)
        }))

        console.log('Small group published successfully')
    } catch ({ message }: any) {
        console.log(
            'Small group published  script execution failed: Error: ',
            message
        )
    }
    return true;
})();
