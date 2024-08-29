import { UserLibraryModel, UserModel } from '../models/index';
import userService from '../services/customers/users/user.service';

// Initialize userLibrary published by machine user
(async () => {
    try {
        // Find all users with their libraries
        const users = await UserModel
            .find({})
            .select('_id libraries')
            .lean()
            .exec();

        if (!users?.length) {
            console.log('User library is empty');
            return false;
        }

        await Promise.all(users.map(async (user) => {
            // Get user's library details for 'reading' and 'view'
            const libraries = await userService.getUserLibrary({ _id: user.libraries }, ['reading', 'view']);

            if (!libraries) {
                console.log(`No libraries found for user: ${user._id}`);
                return;
            }

            // Create a Set to store unique summaries
            const updatedReadings = new Set();
            const updatedViews = [];

            libraries.view.forEach(viewItem => {
                // Find the corresponding book in 'reading' using 'bookId'
                const readingItem = libraries.reading.find((reading: any) => String(reading.bookId) === String(viewItem.bookId));
                
                if (readingItem) {
                    // Update 'createdAt' field in the 'reading' item with 'view' item's 'createdAt'
                    readingItem.createdAt = viewItem.createdAt;
                    updatedReadings.add(readingItem);

                    // Optionally, update 'view' data as needed
                    updatedViews.push(viewItem); // If you need to process or log view data
                }
            });

            // Update the user's library with the modified 'reading' array directly
            await UserLibraryModel.findOneAndUpdate(
                { _id: user.libraries },
                {
                    reading: Array.from(updatedReadings), // Update the reading array
                    view: libraries.view // Ensure view data is not lost
                },
                { upsert: true, new: true } // Ensure the document is created if it doesn't exist and return the new one
            );

            console.log('Updated userLibrary for userId: ', user._id);
        }));

        console.log('User Library reading date successfully updated');
    } catch (error: any) {
        console.log('User Library reading date script execution failed: Error: ', error.message);
    }

    return true;
})();
