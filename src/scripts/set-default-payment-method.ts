import stripeSubscriptionServices from '../services/stripe/subscription'

/** Confirm payment intent */
(async () => {
      try {
            const pi = await stripeSubscriptionServices.getPaymentIntents()

            await Promise.all(pi.map(async i => {
                  if (
                        i.status === 'requires_payment_method' &&
                        i.customer
                  ) {
                        try {
                              const customer =
                                    await stripeSubscriptionServices
                                          .getCustomer(
                                                i.customer
                                          )
                              if (
                                    !customer
                                          .invoice_settings
                                          .default_payment_method
                              ) {
                                    return;
                              }

                              await stripeSubscriptionServices
                                    .confirmPaymentIntent(
                                          i.id,
                                          customer
                                                .invoice_settings
                                                .default_payment_method
                                    );
                        } catch ({ message }: any) {
                              console.log(
                                    'Confirm payment processing error: ',
                                    message
                              )
                        }

                  }
            }))

            console.log(
                  'Confirm payment intents successfully'
            );

      } catch ({ message }: any) {
            console.log(
                  'Confirm payment intent script execution failed, Error: ',
                  message
            )
      }
      return true;
})();
