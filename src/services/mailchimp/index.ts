import crypto from 'crypto'
import axios from 'axios'

import config from '../../../config'

const updateUser = async (
      email: string,
      status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'transactional',
) => {
      try {
            const subscriberHash = crypto.createHash("md5")
                  .update(email.toLowerCase())
                  .digest("hex");
            const listId = '3ca29e1117';
            const auth = Buffer.from(
                  `anystring:${config.MAILCHIMP_API_KEY}`
            ).toString('base64');
            const data = {
                  email_address: email,
                  status_if_new: 'pending',
                  status
            };

            await axios.put(
                  `https://us14.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`,
                  data,
                  {
                        headers: {
                              Accept: "application/json",
                              'Content-Type': "application/json",
                              Authorization: `Basic ${auth}`
                        }
                  }
            );
      } catch (error: any) {
            throw new Error(error)
      }
};

export default {
      updateUser
}
