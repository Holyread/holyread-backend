import { FilterQuery, Types } from 'mongoose'
import { IBookAuthor } from '../../../models/bookAuthor.model'
import { BookAuthorModel, BookSummaryModel } from '../../../models/index'

/** Create Author */
const createAuthor = async (body: any) => {
      try {
            const result: any = await BookAuthorModel.create(body)
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Update Author */
const updateAuthor = async (body: any, id: string) => {
      try {
            const result: any = await BookAuthorModel.findOneAndUpdate(
                  { _id: id },
                  { ...body, updatedAt: new Date() },
                  { new: true }
            ).lean()
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get one Author by filter */
const getOneAuthorByFilter = async (query: any) => {
      try {
            const result: any = await BookAuthorModel.findOne(query).lean()
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all authors for table */
const getAllAuthors = async (skip: number, limit, search: FilterQuery<IBookAuthor>, sort, language: Types.ObjectId) => {
      try {
            const query = { ...search };
            if (language) {
                  query.language = language;
            }
            const authorsList: any = await BookAuthorModel.find(query).select('name about').skip(skip).limit(limit).sort(sort).lean()
            const count = await BookAuthorModel.find(query).countDocuments();
            await Promise.all(authorsList.map(async oneAuthor => {
                  oneAuthor.booksCount = await BookSummaryModel.countDocuments({ author: oneAuthor._id })
            }))
            return { count, authors: authorsList }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all author options list */
const getAllAuthorsOptionsList = async (language: Types.ObjectId) => {
      try {
            const authorsOptionsList = await BookAuthorModel.find({ language }).select('name')
            return authorsOptionsList
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Remove author */
const deleteAuthor = async (id: string) => {
      try {
            await BookAuthorModel.findOneAndDelete({ _id: id })
            return true
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      createAuthor,
      updateAuthor,
      getOneAuthorByFilter,
      getAllAuthors,
      getAllAuthorsOptionsList,
      deleteAuthor,
}
