import { BookAuthorModel } from '../../models/index'

/** Create Author */
const createAuthor = async (body: any) => {
      try {
            let result: any = await BookAuthorModel.create(body)
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
const getAllAuthors = async (skip: number, limit, search: object, sort) => {
      try {
            const authorsList: any = await BookAuthorModel.find(search).skip(skip).limit(limit).sort(sort).lean()
            const count = await BookAuthorModel.find(search).count()
            return { count, authors: authorsList }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all author name */
const getAllAuthorsNames = async () => {
      try {
            const authorsNamesList = await BookAuthorModel.find({}).select('name')
            return authorsNamesList
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
      getAllAuthorsNames,
      deleteAuthor
}
