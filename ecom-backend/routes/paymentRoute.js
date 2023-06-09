const express = require("express");
const {
  processPayment,
  sendStripeApiKey,
} = require("../controller/paymentController");
const router = express.Router();
const { isAuthentication } = require("../middleware/auth");

router.route("/payment/process").post(processPayment);

router.route("/stripeapikey").get(sendStripeApiKey);

module.exports = router;