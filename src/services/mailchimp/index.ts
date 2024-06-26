import crypto from 'crypto'
import axios from 'axios'

import config from '../../../config'

const updateUser = async (
      email: string,
      status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'transactional'
) => {
      try {
            if (config.NODE_ENV !== 'production') return null;
            const subscriberHash = crypto.createHash('md5')
                  .update(email.toLowerCase())
                  .digest('hex');
            const listId = '3ca29e1117';
            const auth = Buffer.from(
                  `anystring:${config.MAILCHIMP_API_KEY}`
            ).toString('base64');
            const data = {
                  email_address: email,
                  status,
            };

            await axios.put(
                  `https://us14.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`,
                  data,
                  {
                        headers: {
                              Accept: 'application/json',
                              'Content-Type': 'application/json',
                              Authorization: `Basic ${auth}`,
                        },
                  }
            );
      } catch (error: any) {
            if (error.response) {
                  // Enhanced error handling for API responses
                  console.error('Mailchimp response data:', error.response.data);
                  throw new Error(`Mailchimp error: ${error.response.data.detail}`);
            } else {
                  // Handle other types of errors (network issues, etc.)
                  console.error('An error occurred:', error.message);
                  throw new Error(`An unexpected error occurred: ${error.message}`);
            }
      }
};

export default {
      updateUser,
}
