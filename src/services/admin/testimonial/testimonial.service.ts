import { TestimonialModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import { responseMessage } from '../../../constants/message.constant'
import { getImageUrl } from '../../../lib/utils/utils'

const { testimonialControllerResponse } = responseMessage

/** Add testimonial */
const createTestimonial = async (body: any) => {
    try {
        const result = await TestimonialModel.create(body)
        if (!result) throw new Error(testimonialControllerResponse.createTestimonialFailure)
        if (result.image) result.image = getImageUrl(result.image, `${awsBucket.testimonialDirectory}`);

        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify testimonial */
const updateTestimonial = async (body: any, id: string) => {
    try {
        const data: any = await TestimonialModel.findOneAndUpdate(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        )
        if (data && data.image) data.image = getImageUrl(data.image, `${awsBucket.testimonialDirectory}`);
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get testimonial by testimonial id */
const getOneTestimonialByFilter = async (query: any) => {
    try {
        const result: any = await TestimonialModel.findOne(query).lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all testimonials for table */
const getAllTestimonials = async (skip: number, limit, search: object, sort) => {
    try {
        const result = await TestimonialModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count = await TestimonialModel.find(search).countDocuments()
        await Promise.all(result.map(async (item: any) => {
            if (!item) return
            if (item.image) item.image = getImageUrl(item.image, `${awsBucket.testimonialDirectory}`);
        }))
        return { count, testimonials: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove testimonial */
const deleteTestimonial = async (id: string) => {
    try {
        await TestimonialModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createTestimonial,
    updateTestimonial,
    getAllTestimonials,
    getOneTestimonialByFilter,
    deleteTestimonial,
}
