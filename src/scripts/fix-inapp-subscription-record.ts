import { UserModel } from '../models/index'
import userService from '../services/customers/users/user.service';

import jwt from 'jsonwebtoken';

/** Set default book views */
(async () => {
      try {
            console.log('InApp Subscription fixed successfully');
            const inAppUsers
                  = await UserModel.find(
                        {
                              device: 'ios',
                              'inAppSubscription': { '$exists': true },
                              'inAppSubscription.expiredAt': { '$exists': false }
                        }
                  ).lean().exec();

            await Promise.all(await inAppUsers.map(async (u: any) => {
                  try {
                        const signedPayload = u?.inAppSubscription?.transactionReceipt
                        if (!signedPayload) {
                              console.log('transactionReceipt is null')
                              return
                        }

                        /* JWS header, payload, and signature representations */
                        var splitParts = signedPayload.split('.');
                        console.log(splitParts.length)
                        if (splitParts.length != 3) {
                              console.log('Invalid signedPayload');
                              return
                        }
                        console.log('processing user ', u.email);
                        if (!splitParts[0]) {
                              console.log('Invalid jws_header part');
                              return
                        }

                        if (!splitParts[1]) {
                              console.log('Invalid jws_payload part');
                              return
                        }

                        if (!splitParts[2]) {
                              console.log('Invalid jws_signature part');
                              return
                        }

                        const encodeHeaderBuff = Buffer.from(splitParts[0], 'base64');
                        const decodedHeader: any = JSON.parse(encodeHeaderBuff.toString());

                        jwt.verify(
                              splitParts[0],
                              decodedHeader.x5c[0],
                              {
                                    algorithms: [decodedHeader.alg]
                              },
                              function (error: { message: string }, payload: Object) {
                                    if (error) {
                                          console.log('decode header error - ', error.message);
                                    }
                              }
                        );

                        var payload = splitParts[1];

                        const dataBuff = Buffer.from(payload, 'base64');
                        const v2Notification = JSON.parse(dataBuff.toString());

                        if (!v2Notification?.data) {
                              console.log('v2Notification is null or is not valid');
                              return;
                        }

                        let v2RenewalInfo = null;
                        if (v2Notification?.data?.signedRenewalInfo) {
                              const renewalInfoBuff
                                    = Buffer
                                          .from(
                                                v2Notification
                                                      .data
                                                      .signedRenewalInfo
                                                      .split(".")[1],
                                                'base64'
                                          );
                              v2RenewalInfo = JSON.parse(renewalInfoBuff.toString());
                        }

                        const transactionInfoBuff
                              = Buffer
                                    .from(
                                          v2Notification
                                                .data
                                                .signedTransactionInfo
                                                .split(".")[1],
                                          'base64'
                                    );
                        const v2TransactionInfo = JSON.parse(transactionInfoBuff.toString());

                        const user
                              = await userService.getOneUserByFilter({
                                    _id: u._id
                              })

                        let inAppSubscriptionStatus = user.inAppSubscriptionStatus;
                        switch (v2Notification?.notificationType) {
                              case 'TEST':
                                    /*
                                          1) A notification type that the App Store server sends when you request
                                          it by calling the Request a Test Notification endpoint.
                                          Call that endpoint to test if your server is receiving notifications.
                                          You receive this notification only at your request.
                                          For more troubleshooting information,
                                          see the Get Test Notification Status endpoint.
                                    */
                                    break;
                              case 'REFUND':
                                    /*
                                          1) Indicates that the App Store successfully refunded a transaction
                                          for a consumable in-app purchase, a non-consumable in-app purchase,
                                          an auto-renewable subscription, or a non-renewing subscription.
                                          
                                          2) The revocationDate contains the timestamp of the refunded transaction.
                                          The originalTransactionId and productId identify the original transaction
                                          and product. The revocationReason contains the reason.
                                          
                                          3) To request a list of all refunded transactions for a user,
                                          see Get Refund History in the App Store Server API.
                                    */
                                    break;
                              case 'REVOKE':
                                    /*
                                          1) Indicates that an in-app purchase the user was entitled to through
                                          Family Sharing is no longer available through sharing.
                                          The App Store sends this notification when a purchaser
                                          disabled Family Sharing for a product, the purchaser (or family member) left the family group,
                                          or the purchaser asked for and received a refund.
                                          Your app also receives a paymentQueue(_:didRevokeEntitlementsForProductIdentifiers:) call.
                                          Family Sharing applies to non-consumable in-app purchases
                                          and auto-renewable subscriptions. For more information about Family Sharing,
                                          see Supporting Family Sharing in Your App.
                                    */
                                    inAppSubscriptionStatus = 'Cancelled'
                                    break;
                              case 'EXPIRED':
                                    /*
                                          1) A notification type that along with its subtype indicates
                                          that a subscription expired. If the subtype is VOLUNTARY,
                                          the subscription expired after the user disabled subscription renewal.
                                          If the subtype is BILLING_RETRY, the subscription expired because
                                          the billing retry period ended without a successful billing transaction.
                                          If the subtype is PRICE_INCREASE, the subscription expired because
                                          the user didn’t consent to a price increase that requires user consent.
                                          If the the subtype is PRODUCT_NOT_FOR_SALE,
                                          the subscription expired because the product wasn’t available for 
                                          purchase at the time the subscription attempted to renew.
            
                                          2) A notification without a subtype indicates that the subscription expired
                                          for some other reason.
                                    */
                                    if (
                                          !v2Notification.subtype ||
                                          [
                                                'BILLING_RETRY',
                                                'PRICE_INCREASE',
                                                'PRODUCT_NOT_FOR_SALE'
                                          ].includes(v2Notification.subtype)
                                    ) {
                                          inAppSubscriptionStatus = 'Cancelled';
                                    }
                                    break;
                              case 'DID_RENEW':
                                    /*
                                          1) A notification type that along with its subtype indicates
                                          that the subscription successfully renewed.
                                          If the subtype is BILLING_RECOVERY, the expired subscription
                                          that previously failed to renew now successfully renewed.
                                          If the substate is empty, the active subscription has successfully
                                          auto-renewed for a new transaction period. Provide the customer with
                                          access to the subscription’s content or service.
                                    */
                                    inAppSubscriptionStatus = 'Active'
                                    break;
                              case 'SUBSCRIBED':
                                    /* 
                                          1) A notification type that along with its subtype indicates that the user
                                          subscribed to a product. If the subtype is INITIAL_BUY, the user either
                                          purchased or received access through Family Sharing to the subscription
                                          for the first time. If the subtype is RESUBSCRIBE, the user
                                          resubscribed or received access through Family Sharing to the same subscription
                                          or to another subscription within the same subscription group.
                                    */
                                    inAppSubscriptionStatus = 'Active'
                                    break;
                              case 'OFFER_REDEEMED':
                                    /*
                                          1) A notification type that along with its subtype indicates that the user
                                          redeemed a promotional offer or offer code.
                                    
                                          2) If the subtype is INITIAL_BUY, the user redeemed the offer for a
                                          first-time purchase. If the subtype is RESUBSCRIBE,
                                          the user redeemed an offer to resubscribe to an inactive subscription.
                                          If the subtype is UPGRADE, the user redeemed an offer to upgrade their
                                          active subscription that goes into effect immediately. If the subtype is DOWNGRADE,
                                          the user redeemed an offer to downgrade their active subscription that goes into
                                          effect at the next renewal date. If the user redeemed an offer for their active
                                          subscription, you receive an OFFER_REDEEMED notification type without a subtype.
                                    
                                          3) For more information about promotional offers, see Implementing Promotional
                                          Offers in Your App. For more information about offer codes, see Implementing Offer
                                          Codes in Your App.
                                    */
                                    inAppSubscriptionStatus = 'Active'
                                    break;
                              case 'PRICE_INCREASE':
                                    /* 
                                          1) A notification type that along with its subtype indicates that the system
                                          has informed the user of an auto-renewable subscription price increase.
                                    
                                          2) If the price increase requires user consent,
                                          the subtype is PENDING if the user hasn’t yet responded to the price increase,
                                          or ACCEPTED if the user has consented to the price increase.
                                    
                                          3) If the price increase doesn’t require user consent, the subtype is ACCEPTED.
                                    
                                          4) For more information about how the system calls your app before it
                                          displays the price consent sheet for subscription price increases
                                          that require customer consent, see paymentQueueShouldShowPriceConsent(_:).
                                          For more information about managing subscription prices, see Managing Price
                                          Increases for Auto-Renewable Subscriptions and Managing Prices.
                                    */
                                    break;
                              case 'REFUND_DECLINED':
                                    /*
                                          1) Indicates that the App Store declined a refund
                                          request initiated by the app developer.
                                    */
                                    break;
                              case 'RENEWAL_EXTENDED':
                                    /*
                                          1) Indicates that the App Store extended the subscription
                                          renewal date that the developer requested.
                                    */
                                    break;
                              case 'DID_FAIL_TO_RENEW':
                                    /*
                                          1) A notification type that along with its subtype indicates
                                          that the subscription failed to renew due to a billing issue.
                                          The subscription enters the billing retry period. If the subtype
                                          is GRACE_PERIOD, continue to provide service through the grace period.
                                          If the subtype is empty, the subscription isn’t in a grace period
                                          and you can stop providing the subscription service.
                                          
                                          2) Inform the user that there may be an issue with 
                                          their billing information.
                                          The App Store continues to retry billing for 60 days,
                                          or until the user resolves their billing issue or cancels 
                                          their subscription,
                                          whichever comes first. For more information, see Reducing
                                          Involuntary Subscriber Churn.
                                    */
                                    if (!v2Notification.subtype) {
                                          inAppSubscriptionStatus = 'Cancelled'
                                    }
                                    break;
                              case 'CONSUMPTION_REQUEST':
                                    /*
                                          1) Indicates that the customer initiated a refund request
                                          for a consumable in-app purchase, and the App Store is
                                          requesting that you provide consumption data. For more information,
                                          see Send Consumption Information.
                                    */
                                    break;
                              case 'GRACE_PERIOD_EXPIRED':
                                    /*
                                          1) Indicates that the billing grace period has ended without
                                          renewing the subscription, so you can turn off access
                                          to service or content. Inform the user that there may
                                          be an issue with their billing information. 
                                          The App Store continues to retry billing for 60 days,
                                          or until the user resolves their billing issue or
                                          cancels their subscription, whichever comes first.
                                          For more information, see Reducing Involuntary Subscriber Churn.
                                    */
                                    inAppSubscriptionStatus = 'Cancelled'
                                    break;
                              case 'DID_CHANGE_RENEWAL_PREF':
                                    /*
                                          1) A notification type that along with its subtype indicates
                                          that the user made a change to their subscription plan.
                                          If the subtype is UPGRADE, the user upgraded their subscription.
                                          The upgrade goes into effect immediately, starting a new billing period,
                                          and the user receives a prorated refund for the unused portion of
                                          the previous period. If the subtype is DOWNGRADE, the user downgraded
                                          or cross-graded their subscription. Downgrades take effect at the next
                                          renewal. The currently active plan isn’t affected.
                                          2) If the subtype is empty, the user changed their renewal preference
                                          back to the current subscription, effectively canceling a downgrade.
                                    */
                                    if (v2Notification.subtype == 'UPGRADE') {
                                          inAppSubscriptionStatus = 'Active';
                                    }
                                    break;
                              case 'DID_CHANGE_RENEWAL_STATUS':
                                    /* 
                                          1) A notification type that along with its subtype indicates that the user
                                          made a change to the subscription renewal status.
                                          If the subtype is AUTO_RENEW_ENABLED, the user re-enabled subscription
                                          auto-renewal. If the subtype is AUTO_RENEW_DISABLED, the user disabled
                                          subscription auto-renewal, or the App Store disabled subscription
                                          auto-renewal after the user requested a refund.
                                    */
                                    break;
                              default:
                                    break;
                        }
                        const inAppPurchaseBody = {
                              ...user.inAppSubscription,
                              renewalInfo: v2RenewalInfo,
                              receipt: signedPayload,
                              notification: v2Notification,
                              transaction: v2TransactionInfo,
                              productId: v2TransactionInfo?.productId,
                              purchaseDate: v2TransactionInfo?.purchaseDate,
                              transactionId: v2TransactionInfo?.transactionId,
                              originalTransactionDateIOS: v2TransactionInfo?.originalPurchaseDate,
                              originalTransactionIdentifierIOS: v2TransactionInfo.originalTransactionId
                        }

                        await userService.updateUser(
                              { _id: user._id },
                              {
                                    inAppSubscription: {
                                          ...user.inAppSubscription,
                                          ...inAppPurchaseBody
                                    },
                                    inAppSubscriptionStatus
                              })
                  } catch ({ message }) {
                        console.log(`${u._id} user processing error - `, message);
                  }
            }))
      } catch (e: any) {
            console.log('InApp Subscription fixed script execution failed - ', e)
      }
      return true;
})();
