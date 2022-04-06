import mongoose, { Schema } from 'mongoose'
mongoose.set('useCreateIndex', true)

export interface IHighLights extends mongoose.Document {
    bookId: string,
    chapterId: string,
    userId: string,
    highLights: [{
        color: string,
        startIndex: number,
        endIndex: number,
        note: string,
        textDecoration?: string,
        text: string
    }],
}

export type createHighLightsType = {
    bookId: string,
    chapterId: string,
    userId: string,
    highLights: [{
        color: string,
        startIndex: number,
        endIndex: number,
        note: string,
        textDecoration?: string,
        text: string
    }],
}

export type getHighLightsType = {
    _id?: string,
    bookId?: string,
    chapterId?: string,
    userId?: string,
    highLights?: [{
        color?: string,
        startIndex?: number,
        endIndex?: number,
        note?: string,
        textDecoration?: string,
        text?: string
    }],
}

export const HighLightsSchema = new Schema({
    bookId: {
        type: Schema.Types.ObjectId,
        ref: 'bookSummary',
        required: true,
        index: true
    },
    chapterId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    highLights: [{
        color: { type: String, required: true },
        startIndex: { type: Number, required: true },
        endIndex: { type: Number, required: true },
        note: { type: String },
        textDecoration: { type: String },
        text: { type: String }
    }],
}, { strict: 'throw' })

HighLightsSchema.index({ userId: -1, bookId: -1, chapterId: -1 });

export const HighLightsModel = mongoose.model<IHighLights>('highLights', HighLightsSchema)
