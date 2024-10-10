import { UserModel } from '../models/index';

(async () => {
    try {
        /** Find users */
        const app_users : any[] = await UserModel
            .find({ 'pushTokens.1': { $exists: true } }) // Look for users with more than one push token
            .select('_id pushTokens') // Select user id and push tokens
            .lean()
            .exec();

        if (!app_users.length) {
            console.log('No users with multiple push tokens found.');
            return;
        }

        await Promise.all(app_users.map(async user => {
            // Keep only the last push token
            const lastPushToken = user.pushTokens[user.pushTokens.length - 1];

            // Update user document with the last push token and set publish to true
            await UserModel.findOneAndUpdate(
                { _id: user._id },
                { pushTokens: [lastPushToken], updatedAt: new Date() },
                { upsert: true }
            );

            console.log(`User ${user._id} updated. Kept last push token.`);
        }));

        console.log('Users updated successfully.');
    } catch (error: any) {
        console.log('Error:', error.message);
    }
})();
