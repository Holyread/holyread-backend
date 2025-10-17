import { NextFunction, Request, Response } from 'express';
import Boom from '@hapi/boom';

import dailyDevotionalService from '../../services/admin/dailyDevotional/dailyDevotional.service';
import { responseMessage } from '../../constants/message.constant';
import { removeS3File, uploadFileToS3, getSearchRegexp, getImageUrl } from '../../lib/utils/utils';
import { awsBucket, dataTable } from '../../constants/app.constant';
import config from '../../../config';
import { FilterQuery } from 'mongoose';
import { IDailyDvotional } from '../../models/dailyDvotional.model';

const dailyDevotionalControllerResponse = responseMessage.dailyDevotionalControllerResponse;

const NODE_ENV = config.NODE_ENV;
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.readsOfDayDirectory}`,
};

const handleFileUpload = async (file: string, title: string, type: string, existingFile: string = '') => {
    if (file && file.includes('base64')) {
        if (existingFile) await removeS3File(existingFile, s3Bucket);
        const directory = type === 'video' ? '/video' : type === 'audio' ? '/audio' : '';
        const s3File : any = await uploadFileToS3(file, title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + directory });
        return { name: s3File.name, size: s3File.size };
    }
    return { name: existingFile };
};

/** Add Daily Devotional */
const addDailyDevotional = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body;
        const language = (req as any).languageId;
        /** Check if title exists */
        if (body.title) {
            const existingDevotional = await dailyDevotionalService.getOneDailyDevotionalByFilter({ title: body.title, language });
            if (existingDevotional) return next(Boom.badData(dailyDevotionalControllerResponse.createDailyDevotionalFailure));
        }

        const imageFile = await handleFileUpload(body.image, body.title || 'read_of_day', 'image');
        const audioFile = await handleFileUpload(body.audio, body.title || 'read_of_day', 'audio');
        const videoFile = await handleFileUpload(body.video, body.title || 'read_of_day' + '-video', 'video');

        const newDevotional = {
            ...body,
            image: imageFile.name,
            audio: audioFile.name,
            video: videoFile.name,
            audioFileSize: audioFile.size,
            videoFileSize: videoFile.size,
            status: body.status || 'Active',
            language,
        };

        const data = await dailyDevotionalService.createDailyDevotional(newDevotional);
        res.status(200).send({ message: dailyDevotionalControllerResponse.createDailyDevotionalSuccess, data });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

/** Get one daily devotional by id */
const getOneDailyDevotional = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        const language = (req as any).languageId;
        const data = await dailyDevotionalService.getOneDailyDevotionalByFilter({ _id: id, language });
        if (!data) return next(Boom.notFound(dailyDevotionalControllerResponse.getDailyDevotionalFailure));
        if (data) {
            if (data.image) data.image = getImageUrl(data.image, awsBucket.readsOfDayDirectory);
            if (data.video) data.video = getImageUrl(data.video, `${awsBucket.readsOfDayDirectory}/video`);
            if (data.audio) data.audio = getImageUrl(data.audio, `${awsBucket.readsOfDayDirectory}/audio`);
        }
        res.status(200).send({ message: dailyDevotionalControllerResponse.fetchDailyDevotionalSuccess, data });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

/** Get all daily devotionals by filter */
const getAllDailyDevotional = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = req.query;
        const skip = Number(params.skip) || dataTable.skip;
        const limit = Number(params.limit) || dataTable.limit;
        const language = (req as any).languageId;
        let searchQuery: FilterQuery<IDailyDvotional> = {};
        if (params.search) {
            searchQuery = {
                $or: [
                    { 'title': await getSearchRegexp(params.search) },
                    { 'category': await getSearchRegexp(params.search) },
                ],
            }
        }

        if (params.statusFilter) {
            searchQuery.publish = params.statusFilter === 'publish';
        }

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const readsOfDaySorting = ['title', 'category', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['createdAt', 'desc']];

        const data = await dailyDevotionalService.getAllDailyDevotional(skip, limit, searchQuery, readsOfDaySorting, language);
        res.status(200).json({ message: dailyDevotionalControllerResponse.fetchDailyDevotionalsSuccess, data });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

/** Update daily devotional */
const updateDailyDevotional = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        const language = (req as any).languageId;
        const existingDevotional = await dailyDevotionalService.getOneDailyDevotionalByFilter({ _id: id, language });

        if (!existingDevotional) return next(Boom.notFound(dailyDevotionalControllerResponse.getDailyDevotionalFailure));

        const imageFile = await handleFileUpload(req.body.image, existingDevotional.title || 'read_of_day', 'image', existingDevotional.image);
        const audioFile = await handleFileUpload(req.body.audio, existingDevotional.title || 'read_of_day', 'audio', existingDevotional.audio);
        const videoFile = await handleFileUpload(req.body.video, existingDevotional.title || 'read_of_day' + '-video', 'video', existingDevotional.video);

        const updatedDevotional = {
            ...req.body,
            image: imageFile.name,
            audio: audioFile.name,
            video: videoFile.name,
            audioFileSize: audioFile.size,
            videoFileSize: videoFile.size,
            language,
        };

        await dailyDevotionalService.updateDailyDevotional(updatedDevotional, id);
        res.status(200).send({ message: dailyDevotionalControllerResponse.updateDailyDevotionalSuccess });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

/** Remove daily devotional */
const deleteDailyDevotional = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        const devotional = await dailyDevotionalService.getOneDailyDevotionalByFilter({ _id: id });

        if (devotional) {
            if (devotional.image) await removeS3File(devotional.image, s3Bucket);
            if (devotional.video) await removeS3File(devotional.video, s3Bucket);
            if (devotional.audio) await removeS3File(devotional.audio, s3Bucket);
        }

        await dailyDevotionalService.deleteDailyDevotional(id);
        res.status(200).send({ message: dailyDevotionalControllerResponse.deleteDailyDevotionalSuccess });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

export {
    addDailyDevotional,
    getAllDailyDevotional,
    updateDailyDevotional,
    deleteDailyDevotional,
    getOneDailyDevotional,
};
