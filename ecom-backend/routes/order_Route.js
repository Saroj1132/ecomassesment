var express = require('express');
const { default: isIBAN } = require('validator/lib/isiban');
const { newOrder, updateOrder, deleteOrder, getAllorders, myOrders, getSingleOrder } = require('../controller/oorderController');
const  {isAuthentication, authorizeRoles}  = require('../middleware/auth');
var router = express.Router();

router.route('/order/new').post(isAuthentication, newOrder)

router.route("/order/:id").get(isAuthentication, getSingleOrder);

router.route("/orders/me").get(isAuthentication, myOrders);

router
  .route("/admin/orders")
  .get(isAuthentication, authorizeRoles("admin"), getAllorders);

router
  .route("/admin/order/:id")
  .put(isAuthentication, authorizeRoles("admin"), updateOrder)
  .delete(isAuthentication, authorizeRoles("admin"), deleteOrder);

module.exports = router;
