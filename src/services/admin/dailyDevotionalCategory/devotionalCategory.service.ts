import { DevotionalCategoryModel } from "../../../models";

const getDevotionalCategory = async () => {
  try {
    const result = await DevotionalCategoryModel.find().lean();
    return result;
  } catch (e: any) {
    throw new Error(e);
  }
};

export default getDevotionalCategory;
