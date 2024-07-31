import { UserModel } from "../models/index";
import firebaseAdmin from "firebase-admin";
import { InvalidTokenModel } from "../models/index";

const BATCH_SIZE = 100; // Adjust batch size as needed

export const pushNotification = async (
    userId, tokens, title, description, args = ""
) => {
    const validTokens = tokens.filter(token => token && typeof token === 'string' && token.trim().length > 0);

    if (validTokens.length === 0) {
        console.error(`No valid tokens found for user ${userId}`);
        await UserModel.updateOne(
            { _id: userId },
            { $set: { pushTokens: [] } }
        );
        return;
    }

    const response = await firebaseAdmin.messaging().sendToDevice(validTokens, {
        notification: {
            title,
            body: description,
        },
        data: {
            info: args,
        },
    });

    const invalidTokens = [];

    response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
            console.error("Failure sending notification to", validTokens[index], error);
            if (
                error.code === "messaging/invalid-recipient" ||
                error.code === "messaging/registration-token-not-registered" ||
                error.code === "messaging/invalid-registration-token" ||
                error.code === "messaging/unknown-error"
            ) {
                invalidTokens.push(validTokens[index]);
            }
        } else {
            console.log("Successfully sent notification to", validTokens[index]);
        }
    });

    if (invalidTokens.length) {
        console.log("Invalid tokens found for user", invalidTokens.length);
        await UserModel.updateOne(
            { _id: userId },
            { $pull: { pushTokens: { token: { $in: invalidTokens } } } }
        );

        await InvalidTokenModel.insertMany({
            userId,
            invalidTokens
        });
        console.log(`Invalid tokens removed for user ${userId}:`, invalidTokens);
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const processUsersInBatches = async () => {
    let skip = 0;

    while (true) {
        const appUsers = await UserModel.find({
            "pushTokens.0": { $exists: true },
        })
            .select("_id pushTokens")
            .lean()
            .skip(skip)
            .limit(BATCH_SIZE)
            .exec();

        if (!appUsers.length) {
            console.log("No more users with push tokens found.");
            break;
        }

        const notificationPayload = {
            title: "🔔 A newer version of the app is available!",
            body: "📙 Please go to the store and update the app.",
        };

        for (const user of appUsers) {
            const tokens = user.pushTokens.map(token => token.token);
            await pushNotification(
                user._id,
                tokens,
                notificationPayload.title,
                notificationPayload.body
            );
            await delay(1000); // Delay of 1 second
        }

        skip += BATCH_SIZE;
    }

    console.log("Users updated successfully.");
};

(async () => {
    try {
        await processUsersInBatches();
    } catch (error: any) {
        console.log("Error:", error.message);
    }
})();
