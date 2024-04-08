import cron from 'cron';
import config from "../../config";
import { contentUpdateAlert } from '../constants/cron.constants'
import { BookSummaryModel, UserModel, RatingModel } from '../models';
import { pushNotification } from '../lib/utils/utils'
import { awsBucket } from '../constants/app.constant';

const start = async () => {
    try {
        console.log('JOB(🟢) content update alert Started successfully!');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const newPublishBook = await BookSummaryModel.findOne({
            publish: true, publishedAt: {
                $gte: today,
                $lt: tomorrow
            }
        }).select([
            '_id',
            'description',
            'overview',
            'bookFor',
            'categories',
            'coverImageBackground',
            'title',
            'author',
            'views',
            'coverImage',
            'totalStar',
            'status'
        ]).populate('author').lean().exec();

        let publishContent;
        let content;

        /** Get book rating */
        const bookRating = await RatingModel.findOne({ bookId: newPublishBook._id }).select('star').lean().exec();
        publishContent = { ...newPublishBook, bookRating };

        const paragraph = publishContent.overview;
        const withoutNbsp = paragraph.replace(/&nbsp;/g, '');
        content = withoutNbsp.replace(/<\/?[^>]+(>|$)/g, '');

        // Find active users with a defined timeZone, at least one push token,
        const users: any = await UserModel.find({
            status: 'Active',
            timeZone: { $exists: true },
            'pushTokens.0': { '$exists': true },
            'notification.push': true,
        }).select('libraries timeZone pushTokens').populate('libraries').lean().exec()

        if (!users.length) {
            console.log('JOB(🔴) content update alert execution stop due to no users found');
        }
        const usersWithCategories = users.filter(user =>
            user.libraries && user.libraries.categories && user.libraries.categories.length > 0
        );
        const usersMatchingCategories = usersWithCategories.filter(user => {
            return user.libraries.categories.some(category => {
                const categoryId = category.toString(); // Convert ObjectId to string
                return newPublishBook.categories.some(newCategory => newCategory.toString() === categoryId);
            });
        });

        usersMatchingCategories.forEach(user => {
            const tokenSet = new Set();
            tokenSet.add(
                pushNotification(
                    user?.pushTokens?.map(token => token.token) || [],
                    '🔔 Fresh Inspiration Alert!',
                    `📙  Explore the latest in your favorite category with titles like ${content}.`,
                    JSON.stringify({
                        publishContents: {
                            _id: publishContent._id,
                            description: publishContent.description,
                            overview: publishContent.overview,
                            bookFor: publishContent.bookFor,
                            categories: publishContent.categories,
                            coverImageBackground: publishContent.coverImageBackground,
                            title: publishContent.title,
                            author: publishContent.author,
                            views: publishContent.views,
                            coverImage: `${awsBucket[config.NODE_ENV].s3BaseURL}/${awsBucket.bookDirectory}/coverImage/${publishContent.coverImage}`,
                            totalStar: publishContent.bookRating.star,
                            status: publishContent.status,
                        }
                    })
                ).catch(error => {
                    console.log('JOB(🔴) push notification publish new book execution Error is -', error.message);
                    return undefined;
                })
            );
        });

        console.log('JOB(✅) content update alert executed successfully!');
    } catch (error: any) {
        console.log('JOB(🔴) content update alert execution Error is - ', error.message);
    }
};

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) content update alert not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(contentUpdateAlert.SCHEDULE).join(' ');
    new cron.CronJob(schedule, () => { start() }, null, true);
    console.log('JOB(🟢) content update alert initiated successfully!');
})(contentUpdateAlert, config);
