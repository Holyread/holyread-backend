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

export default { addDonation }
