var express = require('express');
const { default: isIBAN } = require('validator/lib/isiban');
const { getAllProducts, createProduct, updateProduct, deleteProduct, getProductDetails, createProductReview, deleteReview, getProductReviews, getAdminProducts } = require('../controller/productController');
const  {isAuthentication, authorizeRoles}  = require('../middleware/auth');
var router = express.Router();


router.route('/products').get(getAllProducts)
router.route("/admin/products")
  .get(isAuthentication, authorizeRoles("admin"), getAdminProducts)
router.route('/admin/products/new').post(isAuthentication, authorizeRoles('admin'), createProduct)
router.route('/admin/products/:id').put(isAuthentication, authorizeRoles('admin'), updateProduct)
    .delete(isAuthentication, authorizeRoles('admin'), deleteProduct)

router.route('/products/:id').get(getProductDetails)
router.route("/review").put(isAuthentication, createProductReview)
router
  .route("/reviews")
  .get(getProductReviews)
  .delete(isAuthentication, deleteReview);

module.exports = router;
