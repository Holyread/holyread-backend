import { DonationModel } from "../../../models";

const addDonation = async (body: any) => {
    try {
        const data: any
            = await DonationModel.create(body);
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify Donation */
const updateDonation = async (id: any, body: any) => {
      try {
            const updatedDonation: any = await DonationModel.findOneAndUpdate(
                  { _id: id },
                  { ...body, updatedAt: new Date() },
                  { new: true }
            ).lean()
            return updatedDonation
      } catch (e: any) {
            throw new Error(e)
      }
}

export default { addDonation, updateDonation }
