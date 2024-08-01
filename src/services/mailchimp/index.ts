import crypto from 'crypto';
import axios from 'axios';
import config from '../../../config';

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
            const listId = '3d87bef92c';
            const auth = Buffer.from(`anystring:${config.MAILCHIMP_API_KEY}`).toString('base64');
            const data = {
                  email_address: email,
                  status,
            };

            await axios.put(
                  `https://us20.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`,
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

            if (error.response) {
                  console.error('Mailchimp response data:', error.response.data);

                  // Handle specific Mailchimp errors
                  if (error.response.data.detail.includes('looks fake or invalid')) {
                        console.warn('Invalid email address provided, skipping Mailchimp update');
                  } else {
                        console.error(`Mailchimp error: ${error.response.data.detail}`);
                  }
            } else if (error.request) {
                  console.error('No response received from Mailchimp:', error.request);
            } else {
                  console.error('Error setting up the Mailchimp request:', error.message);
            }
      }
};

export default {
      updateUser,
};
