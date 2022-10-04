import { HandoutsModel } from '../../../models/index'

/** update handout */
const updateHandout = async (query: { [key: string]: any }, body: any) => {
    try {
        await HandoutsModel.updateOne(query, body, { upsert: true })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

const getHandout = async (query: { [key: string]: any }) => {
    try {
        const handout = await HandoutsModel.findOne(query)
        return handout
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    updateHandout,
    getHandout
}
