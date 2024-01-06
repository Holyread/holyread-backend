import { UserModel } from '../models';

(async () => {
    try {
        const users = await UserModel.find({ verified: false }).lean();

        await Promise.all(users.map(async (element) => {
            await UserModel.updateOne(
                { _id: element._id },
                { verified: true, status: 'Active' },
            );
        }));

        console.log('User verified and activated successfully');
    } catch (e: any) {
        console.log('Script execution failed - ', e);
    }
    return true
})();
