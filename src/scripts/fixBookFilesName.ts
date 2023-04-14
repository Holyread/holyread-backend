import config from '../../config';

import { copyS3File } from '../lib/utils/utils';
import { BookSummaryModel } from '../models/index'
import { awsBucket } from '../constants/app.constant';

/** Fix book audio and video filename */
(async () => {
      try {
            const books = await BookSummaryModel
                  .find({})
                  .select([
                        'videoFile',
                        'chapters.audioFile',
                  ]).lean().exec();

            const copyFile = async (
                  name: string,
                  newKey: string
            ) => {
                  const bucketName: string
                        = awsBucket[config.NODE_ENV].bucketName
                  
                  return await copyS3File({
                        bucketName,
                        oldKey:
                              `${bucketName}/${awsBucket.bookDirectory}/audio/${name}`,
                        newKey
                  });
            }

            const next = async (name: string) => {
                  const original = name;
                  name = name.replace(/__/g, '_')

                  const regex = /[^A-Z0-9]+/ig
                  const fileName = name
                        .substring(0, name.lastIndexOf('.'))
                        .replace(regex, '_');

                  const format: string
                        = name.substring(name.lastIndexOf('.'))

                  const newKey: string
                        = `${awsBucket.bookDirectory}/audio/${fileName}${format}`;
                  
                  let isUpdate: boolean = false;
                  if (name !== `${fileName}${format}`) {
                        await copyFile(name, newKey);
                        name = `${fileName}${format}`
                        isUpdate = true;
                  } else {
                        name = original
                  }
                  return { name, isUpdate }
            }

            let vc = 0, ac = 0;
            await Promise.all(books.map(async (book) => {
                  try {
                        if (book.videoFile) {
                              try {
                                    const {
                                          name,
                                          isUpdate
                                    } = await next(
                                          book.videoFile
                                    ) 
                                    if (isUpdate) {
                                          book.video = book.videoFile
                                          vc++;
                                    }
                                    book.videoFile = name
                              } catch ({ message }) {
                                    console.log(
                                          'Book video processing error for book ',
                                          book._id
                                    )
                              }
                        }
                        await Promise.all(
                              book.chapters.map(async (chapter) => {
                                    try {
                                          if (chapter.audioFile) {
                                                const {
                                                      name,
                                                      isUpdate
                                                } = await next(
                                                      book.videoFile
                                                ) 
                                                if (isUpdate) {
                                                      chapter.audio = chapter.audioFile
                                                      ac++;
                                                }
                                                chapter.audioFile = name
                                          }
                                    } catch ({ message }) {
                                          console.log(
                                                'Book audio processing error for book ',
                                                book._id,
                                                'chapter id - ',
                                                chapter.audioFile
                                          )
                                    }
                              })
                        )
                        await BookSummaryModel
                              .findOneAndUpdate(
                                    { _id: book._id },
                                    book
                              )
                  } catch (error: any) {
                        console.log(error.message)
                        console.log(
                              'Error on book updates - ',
                              'book - ',
                              book._id,
                              '- error is - ',
                              error
                        )
                  }
            }));
            console.log(
                  'Book files name fixed successfully',
                  'Total video updated:', vc,
                  'Total audio updated:', ac,
            )

      } catch (e: any) {
            console.log(
                  'Fix books files name script execution failed - ',
                  e
            )
      }
})();
