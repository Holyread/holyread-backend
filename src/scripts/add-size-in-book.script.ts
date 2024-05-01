/**
 * Script used for add size for books audio and video
 * This script was required in past due to some bug
 *
 * when admin tried to update book chapter
 * at that time audio has been removed
 * in above case we was need this script
 * now issue has been solved so script not rquired yet
 */

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

            const query = {
                  '$or': [
                        {
                              'videoFileSize': {
                                    '$exists': false,
                              },
                        },
                        {
                              'chapters.size': {
                                    '$exists': false,
                              },
                        },
                  ],
            }
            const sizeLessBookList = await BookSummaryModel
                  .find(query)
                  .lean()
                  .exec();

            await Promise.all(sizeLessBookList.map(async (oneBook) => {
                  try {
                        if (
                              oneBook.videoFile &&
                              !oneBook.videoFileSize
                        ) {
                              const s3BooksContents = await s3.listObjects({
                                    Bucket: 'holyreads-develop',
                                    Prefix: `books/video/${oneBook.videoFile}`,
                              }).promise();

                              oneBook.videoFileSize = s3BooksContents
                                    .Contents
                                    .find(
                                          oneContent =>
                                                oneContent
                                                      .Key
                                                      .includes(
                                                            'video/' + oneBook.videoFile
                                                      )
                                    )?.Size || 0
                        }
                        await Promise.all(oneBook.chapters.map(async (oneChapter) => {
                              if (
                                    oneChapter.audioFile &&
                                    !oneChapter.size
                              ) {
                                    const s3BooksContents = await s3.listObjects({
                                          Bucket: 'holyreads-develop',
                                          Prefix: `books/audio/${oneChapter.audioFile}`,
                                    }).promise();

                                    oneChapter.size = s3BooksContents
                                          .Contents
                                          .find(
                                                oneContent =>
                                                      oneContent
                                                            .Key
                                                            .includes(
                                                                  'audio/' + oneChapter.audioFile
                                                            )
                                          )?.Size || 0
                              }
                        }))
                        await BookSummaryModel.findOneAndUpdate(
                              { _id: oneBook._id },
                              oneBook
                        )
                  } catch ({ message }: any) {
                        console.log(
                              'Error on book size updates, Error is: ',
                              'book - ',
                              oneBook._id,
                              '- error is - ',
                              message
                        )
                  }
            }));
            console.log(
                  'Book size added successfully'
            )

      } catch ({ message }: any) {
            console.log(
                  'Add size in book script execution failed, Error is: ',
                  message
            )
      }
      return true;
})();
