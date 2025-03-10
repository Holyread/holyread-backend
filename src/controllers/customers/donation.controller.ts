import { NextFunction, Request, Response } from "express";
import Boom from "@hapi/boom";

import stripeSubscriptionService from "../../services/stripe/subscription";

import donationService from "../../services/customers/donation/donation.service";
// import { responseMessage } from "../../constants/message.constant";

/** Get all devotional categories */
const createDonation = async (
  request: Request | any,
  response: Response,
  next: NextFunction
) => {
  try {
    const userObj = request.user
    const { amount } = request.body;

    if (!amount || amount <= 0) {
      response.status(400).json({ error: "Invalid donation details" });
    }

    const paymentIntent = await stripeSubscriptionService.createPaymentIntent({
      amount: Number(amount) * 100,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const donation = await donationService.addDonation({
      userId: userObj._id,
      amount: Number(amount),
      paymentIntentId: paymentIntent.id,
      status: "pending",
    });
    response.json({
      clientSecret: paymentIntent.client_secret,
      donationId: donation._id,
    });
  } catch (e: any) {
    next(Boom.badData(e.message));
  }
};

export { createDonation };
