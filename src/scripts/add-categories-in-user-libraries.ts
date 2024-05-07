import { UserLibraryModel } from '../models/index'

// Initialize userLibrary published  by machine user
(async () => {
    try {
        /** Find userLibrary */
        const userLibrary = await UserLibraryModel
            .find({ 'categories': { $exists: false } })
            .select('_id')
            .lean()
            .exec()

        if (!userLibrary?.length) {
            console.log('User library is empty')
            return false;
        }
        await Promise.all(userLibrary.map(async item => {
            await UserLibraryModel.findOneAndUpdate(
                { _id: item._id },
                { categories: [] },
                { upsert: true }
            )

            console.log('userLibraryIds: ', item._id)
        }))

        console.log('User Library category successfully')
    } catch ({ message }: any) {
        console.log(
            'User Library category  script execution failed: Error: ',
            message
        )
    }
    return true;
})();
