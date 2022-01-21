import { TestimonialModel } from '../../models/index'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'
import { responseMessage } from '../../constants/message.constant'

const NODE_ENV = config.NODE_ENV
const testimonialControllerResponse = responseMessage.testimonialControllerResponse

/** Add testimonial */
const createTestimonial = async (body: any) => {
    try {
        body.status = 'Active'
        const result = await TestimonialModel.create(body)
        if (!result) {
            throw new Error(testimonialControllerResponse.createTestimonialFailure)
        }
        if (result.image) {
            result.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.testimonialDirectory + '/' + result.image
        }
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify testimonial */
const updateTestimonial = async (body: any, id: string) => {
    try {
        if (body.status === true) body.status = 'Active'
        if (body.status === false) body.status = ' Deactive'
        const data: any = await TestimonialModel.findOneAndUpdate(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        )
        if (data && data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.testimonialDirectory + '/' + data.image
        }
        data.status === 'Active' ? data.status = true : data.status = false 
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get testimonial by testimonial id */
const getOneTestimonialByFilter = async (query: any) => {
    try {
        const result: any = await TestimonialModel.findOne(query).lean()
        if (result) {
            result.status === 'Active' ? result.status = true : result.status = false
      }
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all testimonials for table */
const getAllTestimonials = async (skip: number, limit, search: object, sort) => {
    try {
        const result = await TestimonialModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count = await TestimonialModel.find(search).count()
        await Promise.all(result.map(async (item: any) => {
            item.status === 'Active' ? item.status = true : item.status = false
            if (!item) {
                return
            }
            if (item.image) {
                item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.testimonialDirectory + '/' + item.image
            }
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
    deleteTestimonial
}
