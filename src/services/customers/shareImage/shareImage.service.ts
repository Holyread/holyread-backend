import { ShareImageModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV;

/** Get all share image for table */
const getAllShareImage = async () => {
  try {
    const result = await ShareImageModel.find({}).lean().exec();
    result.forEach((item, index, object) => {
      if (item && item.image) {
        object[index] = Object.assign(
          {},
          {
            ...object[index],
            image:
              awsBucket[NODE_ENV].s3BaseURL +
              '/' +
              awsBucket.shareImageDirectory +
              '/' +
              object[index].image,
          }
        );
      }
    });
    return result;
  } catch (e: any) {
    throw new Error(e);
  }
};

export default {
  getAllShareImage,
};
