import { UserModel } from '../models/index'
const ct = require('countries-and-timezones');

// Initialize user published  by machine user
(async () => {
    try {
        /** Find user */
        const users = await UserModel
            .find({ 'timeZone': { $exists: true }, 'country': { $exists: false } })
            .select('_id timeZone')
            .lean()
            .exec()

        if (!users?.length) {
            console.log('No users found')
            return false;
        }
        await Promise.all(users.map(async item => {
            const timezone = ct.getCountriesForTimezone(item.timeZone);
            await UserModel.findOneAndUpdate(
                { _id: item._id },
                { country: timezone[0].name },
                { upsert: true }
            )

            console.log('userIds: ', item._id)
        }))

        console.log('User updated successfully')
    } catch ({ message }: any) {
        console.log(
            'User script execution failed: Error: ',
            message
        )
    }
    return true;
})();
