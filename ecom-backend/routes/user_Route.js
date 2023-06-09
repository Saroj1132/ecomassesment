var express = require('express');
const { registerUser, loginUser, logout, forgotPassword, resetPassword, getUserDetails, updatePassword, updateProfile, getAllUser, getsingleUser, updateUserRole, deleteUser } = require('../controller/userController');
const { isAuthentication, authorizeRoles } = require('../middleware/auth');
var router = express.Router();
const { body, validationResult } = require('express-validator');

router.route('/register', [
    body('email').isEmail(),
    body('password').isLength({ min: 5 }),
    body('name').isLength({ min: 3 })
]).post(registerUser)
router.route('/login').post(loginUser)
router.route('/password/forgot').post(forgotPassword)
router.route('/passwordreset/:token').put(resetPassword)
router.route('/logout').get(logout)
router.route('/me').get(isAuthentication, getUserDetails)
router.route('/password/update').put(isAuthentication, updatePassword)
router.route('/me/update').put(isAuthentication, updateProfile)
router.route('/admin/users').get(isAuthentication, authorizeRoles('admin'), getAllUser)
router.route('/admin/users/:id').get(isAuthentication, authorizeRoles('admin'), getsingleUser)
.put(isAuthentication, authorizeRoles("admin"), updateUserRole)
.delete(isAuthentication, authorizeRoles("admin"), deleteUser);

module.exports = router;
