import { UserFeedBackModel } from "../../../models";

const addFeedback = async (body: any) => {
    try {
        const data: any
            = await UserFeedBackModel.create(body);
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

export default { addFeedback }
