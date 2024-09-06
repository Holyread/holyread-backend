import { UserModel } from '../models/index';
import transactionsService from '../services/admin/users/transactions.service';
import usersService from '../services/admin/users/user.service';
import ratingService from '../services/customers/book/rating.service';
import highLightsService from '../services/customers/highLights/highLights.service';
import notificationsService from '../services/customers/notifications/notifications.service';

(async () => {
    try {
        /** Find users */
        const users = await UserModel
            .find({
                'isSignedUp': true,
                createdAt: { $lt: new Date('2024-07-01T00:00:00Z') },
                '$or': [
                    {
                          'inAppSubscription': {'$exists': false},
                    },
                    {
                          'stripe': {'$exists': false},
                    },
              ],
            })
            .lean()
            .exec();

        console.log(`Total Freemium Users: ${users.length}`);

        if (!users.length) {
            console.log('No users found.');
            return;
        }

        await Promise.all(users.map(async user => {
            await usersService.deleteUser({ _id: user._id }),
                await ratingService.deleteRatings({ userId: user._id }),
                await highLightsService.deleteHighLights({ userId: user._id }),
                await transactionsService.deleteTransaction({ userId: user._id }),
                await notificationsService.deleteNotifications({ userId: user._id }),
                await usersService.deleteUserLibrary({ _id: user.libraries })

            console.log(`Non Signup User ${user._id} ${user.libraries} Deleted Successfully`);
        }));

        console.log('Non-Signup users deleted successfully.');
    } catch (error: any) {
        console.log('Error:', error.message);
    }
})();
