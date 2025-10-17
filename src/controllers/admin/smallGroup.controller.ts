import { NextFunction, Request, Response } from 'express';
import Boom from '@hapi/boom';

import smallGroupService from '../../services/admin/smallGroup/smallGroup.service'
import bookSummaryService from '../../services/admin/book/bookSummary.service'
import { responseMessage } from '../../constants/message.constant'
import { getImageUrl, getSearchRegexp, removeS3File, uploadFileToS3 } from '../../lib/utils/utils'
import { awsBucket, dataTable } from '../../constants/app.constant'
import config from '../../../config'
import { ISmallGroup } from '../../models/smallGroup.model';
import { FilterQuery } from 'mongoose';

const smallGroupControllerResponse = responseMessage.smallGroupControllerResponse
const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.smallGroupDirectory}`,
}

/** Add small group */
const addSmallGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { body } = req;
        const language = (req as any).languageId;
        const existingSmallGroup = await smallGroupService.getOneSmallGroupByFilter({ title: body.title, language });
        if (existingSmallGroup) {
            return next(Boom.notFound(smallGroupControllerResponse.createSmallGroupFailure));
        }

        if (body.books.length) {
            body.books = await Promise.all(body.books.filter(async (oneBook) => {
                const bookDetails = await bookSummaryService.getOneBookSummaryByFilter({ _id: oneBook });
                return !!bookDetails;
            }));
        }

        if (body.coverImage) {
            const s3File: any = await uploadFileToS3(body.coverImage, body.title, s3Bucket);
            body.coverImage = s3File.name;
        }

        body.language = language;
        const data = await smallGroupService.createSmallGroup(body);
        res.status(200).send({
            message: smallGroupControllerResponse.createSmallGroupSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
};

/**  Get one small group by id */
const getOneSmallGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const data = await smallGroupService.getOneSmallGroupByFilter({ _id: id });
        if (!data) {
            return next(Boom.notFound(smallGroupControllerResponse.getSmallGroupFailure));
        }
        if (data.books.length) {
            data.books.forEach((element) => {
                if (element?.coverImage) element.coverImage = getImageUrl(data.coverImage, `${awsBucket.bookDirectory}/coverImage`);
            });
        }
        if (data.coverImage) data.coverImage = getImageUrl(data.coverImage, awsBucket.smallGroupDirectory);

        
        res.status(200).send({ message: smallGroupControllerResponse.fetchSmallGroupSuccess, data });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

/** Get all small groups by filter */
const getAllSmallGroups = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query } = req;
        const skip = Number(query.skip) || dataTable.skip;
        const limit = Number(query.limit) || dataTable.limit;
        const language = (req as any).languageId;

        let searchFilter: FilterQuery<ISmallGroup> = {};
        if (query.search) {
            const search = await getSearchRegexp(query.search as string);
            searchFilter = {
                $or: [{ title: search }],
            };
        }


        if (query.bookStatusFilter) {
            if (query.bookStatusFilter === 'publish') {
                searchFilter.publish = true;
            }
            else if (query.bookStatusFilter === 'pending') {
                searchFilter.publish = false;
            }
        }
        const sortingColumn = query.column as string;
        const sortingOrder = query.order || 'asc';
        const sortingOptions = ['title', 'iceBreaker', 'description', 'introduction', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['title', 'desc']];

        const data = await smallGroupService.getAllSmallGroups(skip, limit, searchFilter, sortingOptions, language);
        res.status(200).json({ message: smallGroupControllerResponse.fetchSmallGroupSuccess, data });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

/** Update small group */
const updateSmallGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { body } = req;
        const language = (req as any).languageId;
        const smallGroupDetails = await smallGroupService.getOneSmallGroupByFilter({ _id: id });

        if (!smallGroupDetails) return next(Boom.notFound(smallGroupControllerResponse.getSmallGroupFailure));
        if (body.coverImage === null) await removeS3File(smallGroupDetails.coverImage, s3Bucket);
        
        if (body.coverImage?.includes('base64')) {
            await removeS3File(smallGroupDetails.coverImage, s3Bucket);
            const s3File: any = await uploadFileToS3(body.coverImage, smallGroupDetails.title, s3Bucket);
            body.coverImage = s3File.name;
        } else if (body.coverImage?.startsWith('http')) {
            body.coverImage = smallGroupDetails.coverImage;
        }
        body.language = language;
        await smallGroupService.updateSmallGroup(body, id);
        res.status(200).send({ message: smallGroupControllerResponse.updateSmallGroupSuccess });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

/** Remove small group */
const deleteSmallGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const smallGroupDetails = await smallGroupService.getOneSmallGroupByFilter({ _id: id });
        if (smallGroupDetails?.coverImage) await removeS3File(smallGroupDetails.coverImage, s3Bucket);
        await smallGroupService.deleteSmallGroup(id);
        res.status(200).send({ message: smallGroupControllerResponse.deleteSmallGroupSuccess });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

export { addSmallGroup, getOneSmallGroup, getAllSmallGroups, updateSmallGroup, deleteSmallGroup };
