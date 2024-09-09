import { randomNumberInRange } from "../lib/utils/utils";
import { BookSummaryModel } from "../models";
import { UserModel } from "../models";
(async () => {
    try {
        console.log('Updating most popular views for books');

        const skip = 0
        const limit = 100

        const page: any = [{ $limit: limit }]

        const result = await UserModel.aggregate(
            [
                {
                    '$match': {
                        'libraries': {
                            '$exists': true,
                        },
                    },
                },
                {
                    '$lookup': {
                        'from': 'userlibraries',
                        'localField': 'libraries',
                        'foreignField': '_id',
                        'as': 'libraries',
                    },
                },
                {
                    '$unwind': {
                        'path': '$libraries',
                    },
                },
                {
                    '$match': {
                        'libraries.reading.bookId': {
                            '$exists': true,
                        },
                    },
                },
                {
                    '$unwind': {
                        'path': '$libraries.reading',
                    },
                },
                {
                    '$lookup': {
                        'from': 'booksummaries',
                        'localField': 'libraries.reading.bookId',
                        'foreignField': '_id',
                        'as': 'libraries.reading.bookId',
                    },
                },
                {
                    '$unwind': {
                        'path': '$libraries.reading.bookId',
                    },
                },
                {
                    '$match': {
                        'libraries.reading.bookId.publish': true,
                        'libraries.reading.bookId._id': { $exists: true },
                    },
                },
                {
                    '$group': {
                        '_id': '$libraries.reading.bookId._id',
                        'emails': {
                            '$push': {
                                'email': '$email',
                            },
                        },
                    },
                },
                {
                    '$group': {
                        '_id': '$_id',
                        'total': {
                            '$sum': {
                                '$size': '$emails',
                            },
                        },
                    },
                },
                {
                    '$sort': {
                        'total': -1.0,
                    },
                },
                {
                    $facet: {
                        page
                            : skip
                                ? page.concat({ $skip: skip })
                                : page,
                    },
                },
            ]
        )

        await Promise.all(
            result[0].page.map(async (i) => {
                const id = i._id;
                await BookSummaryModel.updateOne(
                    { _id: id },
                    { views: randomNumberInRange(60000, 75000) }
                );
                console.log(`Views ${id} updated Successfully`);
            })
        );
        console.log('Most popular views updated successfully');
    } catch (e: any) {
        console.log('Set default views script execution failed - ', e);
    }
    return true;
})();
