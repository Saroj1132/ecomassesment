const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const stripe = require("stripe")('sk_test_51M2sSXSIHfWXY6tAF5aZBCarbPiwbwVfGsyXerPI5PFHweLABSXIyzK9HDbAZvw2zgXAb4Qv4aCkT2KLf9NSm2o800xTCjhBgZ');

module.exports = {
    processPayment : catchAsyncErrors(async (req, res, next) => {
  const myPayment = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "inr",
    metadata: {
      company: "Ecommerce",
    },
  });

  res
    .status(200)
    .json({ success: true, client_secret: myPayment.client_secret });
}),

    sendStripeApiKey : catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({ stripeApiKey: 'pk_test_51M2sSXSIHfWXY6tADf84zIkj8rtzNRG9x6THVvFGZXFNbzPjAHtPYo0Ejq4caT23NJkncvKXYHJPXDJbckGyLyFo00xAoRzkqH' });
})
}
