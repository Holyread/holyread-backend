import { NextFunction, Request, Response } from "express";
import Boom from "@hapi/boom";
import { responseMessage } from "../../constants/message.constant";

import stripeSubscriptionService from "../../services/stripe/subscription";
import donationService from "../../services/customers/donation/donation.service";

const subscriptionsControllerResponse =
  responseMessage.subscriptionsControllerResponse;

/** Get all devotional categories */
const createDonation = async (
  request: Request | any,
  response: Response,
  next: NextFunction
) => {
  try {
    const userObj = request.user;
    const { amount } = request.body;

    if (!amount || amount <= 0) {
      response.status(400).json({ error: "Invalid donation details" });
    }

    const donation = await donationService.addDonation({
      userId: userObj._id,
      amount: Number(amount),
      status: "pending",
    });

    const paymentIntent = await stripeSubscriptionService.createPaymentIntent({
      amount: Number(amount) * 100,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: { donationId: donation._id.toString() },
    });

    await donationService.updateDonation(
      { _id: donation._id },
      { paymentIntentId: paymentIntent.id }
    );

    response.status(200).send({
      message: subscriptionsControllerResponse.donationSuccess,
      data: {
        donationId: donation._id,
        paymentIntentId: paymentIntent?.id,
        clientSecret: paymentIntent?.client_secret,
        customerEmail: userObj.email,
      },
    });
  } catch (e: any) {
    next(Boom.badData(e.message));
  }
};

export { createDonation };
