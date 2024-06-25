import { NextFunction, Request, Response } from 'express';
import Boom from '@hapi/boom';

import bookCategoryService from '../../../services/admin/book/bookCategory.service';
import bookSummaryService from '../../../services/admin/book/bookSummary.service';
import recommendedBookService from '../../../services/admin/book/recommendedBook.service';
import { responseMessage } from '../../../constants/message.constant';
import { removeS3File, uploadFileToS3, getSearchRegexp, randomNumberInRange } from '../../../lib/utils/utils';
import { awsBucket, dataTable } from '../../../constants/app.constant';
import config from '../../../../config';
import userService from '../../../services/admin/users/user.service';
import ratingService from '../../../services/customers/book/rating.service';

const {
    bookCategoryControllerResponse,
    bookSummaryControllerResponse,
} = responseMessage;

const NODE_ENV = config.NODE_ENV;
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.bookDirectory}`,
};

const uploadS3Files = async (body: any) => {
    if (body.coverImage) {
        const s3File: any = await uploadFileToS3(body.coverImage, body.title, {
            ...s3Bucket,
            documentDirectory: `${s3Bucket.documentDirectory}/coverImage`,
        });
        body.coverImage = s3File.name;
    }

    if (body.bookReadFile) {
        const s3File: any = await uploadFileToS3(body.bookReadFile, `${body.title}-reads`, {
            ...s3Bucket,
            documentDirectory: `${s3Bucket.documentDirectory}/reads`,
        });
        body.bookReadFile = s3File.name;
    }

    if (body.chapters && body.chapters.length) {
        await Promise.all(
            body.chapters.map(async (chapter) => {
                if (chapter.audioFile) {
                    const s3File: any = await uploadFileToS3(chapter.audioFile, chapter.name, {
                        ...s3Bucket,
                        documentDirectory: `${s3Bucket.documentDirectory}/audio`,
                    });
                    chapter.audioFile = s3File.name;
                    chapter.size = s3File.size;
                }
            })
        );
    }

    if (body.videoFile) {
        const s3File: any = await uploadFileToS3(body.videoFile, `${body.title}-video`, {
            ...s3Bucket,
            documentDirectory: `${s3Bucket.documentDirectory}/video`,
        });
        body.videoFile = s3File.name;
        body.videoFileSize = s3File.size;
    }

    body.views = randomNumberInRange(5, 15);
};

const addSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body;

        const summaryExists = await bookSummaryService.getOneBookSummaryByFilter({ title: body.title });
        if (summaryExists) return next(Boom.badData(bookSummaryControllerResponse.createBookSummaryFailure));

        if (body.categories?.length) {
            const categoryExists = await bookCategoryService.getOneBookCategoryByFilter({ _id: { $in: body.categories } });
            if (!categoryExists) return next(Boom.badData(bookCategoryControllerResponse.getBookCategoryFailure));
        }

        await uploadS3Files(body);

        const data = await bookSummaryService.createBookSummary(body);
        res.status(200).send({
            message: bookSummaryControllerResponse.createBookSummarySuccess,
            data,
        });

        const user = await userService.getOneUserByFilter({ email: 'bot@holyreads.com' });
        if (user) {
            await ratingService.updateRating({
                bookId: data._id,
                star: Number(`${randomNumberInRange(3, 5)}.${randomNumberInRange(1, 5)}`),
                description: '',
                userId: user._id,
            });
        }
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
}

const getOneSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const data = await bookSummaryService.getOneBookSummaryByFilter({ _id: id });

        if (!data) return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure));

        const s3BaseUrl = awsBucket[NODE_ENV].s3BaseURL;
        const s3DocumentDir = s3Bucket.documentDirectory;

        if (data.coverImage) data.coverImage = `${s3BaseUrl}/${s3DocumentDir}/coverImage/${data.coverImage}`;
        if (data.bookReadFile) data.bookReadFile = `${s3BaseUrl}/${s3DocumentDir}/reads/${data.bookReadFile}`;
        if (data.videoFile) data.videoFile = `${s3BaseUrl}/${s3DocumentDir}/video/${data.videoFile}`;


        if (data.chapters?.length) {
            data.chapters.forEach((chapter) => {
                if (chapter.audioFile) {
                    chapter.audioFile = `${s3BaseUrl}/${s3DocumentDir}/audio/${chapter.audioFile}`;
                }
            });
        }

        if (data.categories) {
            const categoryObj = await bookCategoryService.getAllBookCategory(0, 0, { _id: { $in: data.categories } }, [['createdAt', 'desc']]);
            data.categories = categoryObj.categories;
        }

        res.status(200).send({
            message: bookSummaryControllerResponse.fetchBookSummarySuccess,
            data,
        });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

const getAllSummaries = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { skip = dataTable.skip, limit = dataTable.limit, search, status, bookStatusFilter, column, order } = req.query;

        const searchFilter: any = {};
        if (search) {
            searchFilter.$or = [
                { title: await getSearchRegexp(search) },
                { status: await getSearchRegexp(search) },
            ];
        }

        if (status && status === 'MostPopular') {
            searchFilter.popular = true;
        }
        if (bookStatusFilter) {
            if (bookStatusFilter === 'publish') {
                searchFilter.publish = true;
            }
            else if (bookStatusFilter === 'pending') {
                searchFilter.publish = false;
            }
        }

        let summarySorting = [];
        const sortingColumn = column as string;
        const sortingOrder = order || 'asc';
        summarySorting = ['title', 'status', 'author', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['createdAt', 'desc']];
        if (status && status === 'NewlyAdded') {
            summarySorting = [['createdAt', 'desc']];
        }

        const data = await bookSummaryService.getAllBookSummaries(Number(skip), Number(limit), searchFilter, summarySorting);
        res.status(200).json({
            message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
            data,
        });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

const getAllSummariesOptionsList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { category } = req.query;
        const query = category ? { categories: { $in: [category] } } : {};
        const data = await bookSummaryService.getAllBookSummariesOptionsList(query);
        res.status(200).json({
            message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
            data,
        });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

const updateSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const summaryDetails = await bookSummaryService.getOneBookSummaryByFilter({ _id: id });
        if (!summaryDetails) return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure));

        const updateFile = async (file: string, type: string, oldFile: string) => {
            if (file === null) {
                await removeS3File(oldFile, { ...s3Bucket, documentDirectory: `${s3Bucket.documentDirectory}/${type}` });
            } else if (file.includes('base64')) {
                await removeS3File(oldFile, { ...s3Bucket, documentDirectory: `${s3Bucket.documentDirectory}/${type}` });
                const s3File: any = await uploadFileToS3(file, summaryDetails.title, {
                    ...s3Bucket,
                    documentDirectory: `${s3Bucket.documentDirectory}/${type}`,
                });
                return s3File.name;
            } else if (file.startsWith('http')) {
                return oldFile;
            }
        };

        req.body.coverImage = await updateFile(req.body.coverImage, 'coverImage', summaryDetails.coverImage);
        req.body.bookReadFile = await updateFile(req.body.bookReadFile, 'reads', summaryDetails.bookReadFile);
        req.body.videoFile = await updateFile(req.body.videoFile, 'video', summaryDetails.videoFile);

        if (req.body.chapters?.length) {
            await Promise.all(
                req.body.chapters.map(async (chapter) => {
                    const oldChapter = summaryDetails.chapters.find((ch) => String(ch._id) === String(chapter._id));
                    chapter.audioFile = await updateFile(chapter.audioFile, 'audio', oldChapter?.audioFile);
                    chapter.size = chapter.audioFile ? oldChapter?.size || 0 : 0;
                })
            );
        }

        await bookSummaryService.updateBookSummary(req.body, id);
        res.status(200).send({
            message: bookCategoryControllerResponse.updateBookCategorySuccess,
        });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

const deleteSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const summaryDetails = await bookSummaryService.getOneBookSummaryByFilter({ _id: id });

        if (!summaryDetails) return res.status(404).send({ message: 'Book summary not found' });

        const recommendedBook = await recommendedBookService.getOneRecommendedBookByFilter({ book: id });
        if (recommendedBook) return next(Boom.notFound(bookSummaryControllerResponse.recommendedBookError));

        const s3Paths = [
            { file: summaryDetails.coverImage, path: 'coverImage' },
            { file: summaryDetails.bookReadFile, path: 'reads' },
            { file: summaryDetails.videoFile, path: 'video' },
        ];

        if (summaryDetails.chapters?.length) {
            summaryDetails.chapters.forEach((chapter) => {
                if (chapter.audioFile) {
                    s3Paths.push({ file: chapter.audioFile, path: 'audio' });
                }
            });
        }

        await Promise.all(
            s3Paths.map(async ({ file, path }) => {
                if (file) {
                    await removeS3File(file, { ...s3Bucket, documentDirectory: `${s3Bucket.documentDirectory}/${path}` });
                }
            })
        );

        await bookSummaryService.deleteBookSummary(id);
        res.status(200).send({
            message: bookCategoryControllerResponse.deleteBookCategorySuccess,
        });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

export { addSummary, getOneSummary, getAllSummaries, getAllSummariesOptionsList, updateSummary, deleteSummary };
