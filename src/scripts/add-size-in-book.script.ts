import aws from 'aws-sdk'

import { BookSummaryModel } from '../models/index'

import config from '../../config'
import { awsBucket } from '../constants/app.constant';

/** Update book and add size of audio and video file */
(async () => {
      try {
            const s3 = new aws.S3({
                  secretAccessKey: config.AWS_SECRET,
                  accessKeyId: config.AWS_ACCESSKEY,
                  region: awsBucket.region,
            })
            /** Get S3 bucket files contents  */
            const s3BooksContents = await s3.listObjectsV2({
                  Bucket: 'holyreads-develop',
                  Prefix: 'books'
            }).promise();
            const query = {
                  '$or': [
                        { 'videoFileSize': { '$exists': false } },
                        { 'chapters.size': { '$exists': false } },
                  ]
            }
            const sizeLessBookList = await BookSummaryModel.find(query).lean().exec();

            await Promise.all(sizeLessBookList.map(async (oneBook) => {
                  try {
                        if (oneBook.videoFile && !oneBook.videoFileSize) {
                              oneBook.videoFileSize = s3BooksContents.Contents.find(oneContent => oneContent.Key.includes('video/' + oneBook.videoFile))?.Size || 0
                        }
                        await Promise.all(oneBook.chapters.map(async (oneChapter) => {
                              if (oneChapter.audioFile && !oneChapter.size) {
                                    oneChapter.size = s3BooksContents.Contents.find(oneContent => oneContent.Key.includes('audio/' + oneChapter.audioFile))?.Size || 0
                              }
                        }))
                        await BookSummaryModel.findOneAndUpdate({ _id: oneBook._id }, oneBook)
                  } catch (error) {
                        console.log('Error on book size updates - ', 'book - ', oneBook._id, '- error is - ', error)
                  }
            }));
            console.log('Book size added successfully')

      } catch (e: any) {
            console.log('Add size in book script execution failed - ', e)
      }
      return true;
})();
