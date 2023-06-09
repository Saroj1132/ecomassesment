const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const user_Model = require("../models/user_Model");
const bcrypt = require('bcryptjs')
const ErrorHandler = require("../utils/errorhandler");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary"); const nodeMailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

module.exports = {
    registerUser: catchAsyncErrors(async (req, res, next) => {
        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
        });
        const { name, email, password } = req.body
        let success = false
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success, errors: errors.array() })
        }else{
            await user_Model.findOne({ email: email }).exec()
            .then((_emailfound) => {
                console.log(_emailfound)
                if (!_emailfound) {
                    bcrypt.hash(password, 10, (err, hash) => {
                        const _user = user_Model({
                            name,
                            email,
                            password: hash,
                            avatar: {
                                public_id: myCloud.public_id,
                                url: myCloud.secure_url
                            }
                        })
                        _user.save().then((user) => {
                            sendToken(user, 201, res)
                        })
                    })
                } else {
                    return next(new ErrorHandler("Email is already used", 404));

                }
            })
        }
        
    }),

    loginUser: catchAsyncErrors(async (req, res, next) => {
        const { email, password } = req.body
        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 404));
        } else {
            user_Model.findOne({ email: email })
                .exec()
                .then((user) => {
                    if (user) {
                        if (bcrypt.compareSync(password, user.password)) {
                            sendToken(user, 201, res)
                        } else {
                            return next(new ErrorHandler("Invalid email and password", 404));
                        }
                    } else {
                        return next(new ErrorHandler("Invalid email and password", 404));
                    }
                })

        }
    }),

    logout: catchAsyncErrors(async (req, res, next) => {
        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true
        })

        res.status(200).json({
            success: true,
            message: 'Logged Out'
        })
    }),

    // // Forgot Password
    forgotPassword: catchAsyncErrors(async (req, res, next) => {
        const user = await user_Model.findOne({ email: req.body.email });

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Get ResetPassword Token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        const resetPasswordUrl = `${req.protocol}://${req.get(
            "host"
        )}/password/reset/${resetToken}`;

        const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

        try {

            const transporter = nodeMailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                service: 'gmail',
                auth: {
                    user: 'sarojpanigrahi425@gmail.com',
                    pass: '8866141306',
                },
            });

            const mailOptions = {
                from: 'sarojpanigrahi425@gmail.com',
                to: user.email,
                subject: 'Ecommerce Password Recovery',
                text: message,
            };

            transporter.sendMail(mailOptions);

            res.status(200).json({
                success: true,
                message: `Email sent to ${user.email} successfully`,
            });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return next(new ErrorHandler(error.message, 500));
        }
    }),
    resetPassword: catchAsyncErrors(async (req, res, next) => {
        // creating token hash
        const resetPasswordToken = crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex");

        await user_Model.findOne({
            resetPasswordToken: resetPasswordToken
        }).then((user) => {
            if (!user) {
                return next(
                    new ErrorHandler(
                        "Reset Password Token is invalid or has been expired",
                        400
                    )
                );
            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    user_Model.findOneAndUpdate({ resetPasswordToken: resetPasswordToken },
                        {
                            password: hash
                        }).exec().then((_user) => {
                            sendToken(_user, 201, res)
                        })
                })
            }
        })
    }),

    getUserDetails: catchAsyncErrors(async (req, res, next) => {
        user_Model.findById({ _id: req.user._id })
            .exec().then((user) => {
                console.log(req.user.role)
                res.status(200).json({
                    success: true,
                    user
                })
            })
    }),

    updatePassword: catchAsyncErrors(async (req, res, next) => {
        user_Model.findById({ _id: req.user._id }).exec()
            .then((_user) => {
                if (_user) {
                    console.log(_user.password)
                    if (bcrypt.compareSync(req.body.oldPassword, _user.password)) {
                        bcrypt.hash(req.body.newPassword, 10, (err, hash) => {
                            user_Model.findOneAndUpdate({ _id: req.user._id },
                                {
                                    password: hash
                                }).exec().then((_user) => {
                                    sendToken(_user, 201, res)
                                })
                        })
                    } else {
                        return next(new ErrorHandler("old password was incorrected", 404));
                    }
                } else {
                    return next(new ErrorHandler("something wrong", 404));
                }
            })
    }),
    updateProfile: catchAsyncErrors(async (req, res, next) => {
        const newUserData = {
            name: req.body.name,
            email: req.body.email,
          };
        
          if (req.body.avatar !== "") {
            const user = await user_Model.findById(req.user._id);
        
            const imageId = user.avatar.public_id;
        
            await cloudinary.v2.uploader.destroy(imageId);
        
            const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
              folder: "avatars",
              width: 150,
              crop: "scale",
            });
        
            newUserData.avatar = {
              public_id: myCloud.public_id,
              url: myCloud.secure_url,
            };
          }
        
          const user = await user_Model.findByIdAndUpdate(req.user._id, newUserData, {
            new: true,
            runValidators: true,
            useFindAndModify: false,
          });
        
          res.status(200).json({
            success: true,
          });
    }),
    getAllUser: catchAsyncErrors(async (req, res, next) => {
        const users = await user_Model.find({role:'user'});

            res.status(200).json({
            success: true,
            users,
        });
    }),
    getsingleUser: catchAsyncErrors(async (req, res, next) => {
        user_Model.findById({ _id: req.params.id })
            .exec().then((_user) => {
                if (_user) {
                    res.status(200).json({
                        success: true,
                        _user
                    })
                } else {
                    return next(new ErrorHandler(`user does not exist with id ${req.params.id}`, 404));
                }
            })
    }),
    updateUserRole: catchAsyncErrors(async (req, res, next) => {
        const newUserData = {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
        };

        await user_Model.findByIdAndUpdate(req.params.id, newUserData, {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        });

        res.status(200).json({
            success: true,
        });
    }),

    // Delete User --Admin
    deleteUser: catchAsyncErrors(async (req, res, next) => {
        user_Model.findByIdAndDelete({ _id: req.params.id })
          .exec().then((user) => {
            res.status(200).json({
              success: true
            })
          })
    })

}