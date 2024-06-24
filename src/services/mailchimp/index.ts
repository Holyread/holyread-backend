import crypto from 'crypto'
import axios from 'axios'

import config from '../../../config'

const updateUser = async (
      email: string,
      status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'transactional'
) => {
      try {
            if (config.NODE_ENV !== 'production') {
                  console.log('Skipping Mailchimp update in non-production environment');
                  return null;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                  throw new Error('Invalid email format');
            }

            const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
            const listId = '3ca29e1117';
            const auth = Buffer.from(`anystring:${config.MAILCHIMP_API_KEY}`).toString('base64');
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

            console.log(`Successfully updated user ${email} to status ${status}`);
      } catch (error: any) {
            console.error(`Failed to update user ${email}:`, error.message);

            // Enhance error message with more context if necessary
            if (error.response) {
                  console.error('Mailchimp response data:', error.response.data);
                  throw new Error(`Mailchimp error: ${error.response.data.detail}`);
            } else if (error.request) {
                  console.error('No response received from Mailchimp:', error.request);
                  throw new Error('No response received from Mailchimp');
            } else {
                  console.error('Error setting up the Mailchimp request:', error.message);
                  throw new Error('Error setting up the Mailchimp request');
            }
      }
};

export default {
      updateUser,
}
