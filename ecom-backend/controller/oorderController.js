const order_model = require('../models/order_Model')
const ErrorHandler = require('../utils/errorhandler')
const catchAsyncErrors = require('../middleware/catchAsyncErrors')
const ApiFeatures = require('../utils/apifeatures')
const produc_Model = require('../models/produc_Model')

module.exports = {
    newOrder: catchAsyncErrors(async (req, res, next) => {
        const {
            shippingInfo,
            orderItems,
            paymentInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
        } = req.body;

        const order = new order_model({
            shippingInfo,
            orderItems,
            paymentInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paidAt: Date.now(),
            user: req.user._id,

        })
        await order.save().then((_order) => {
            res.status(201).json({
                success: true,
                _order
            })
        })

    }),
    //single order
    getSingleOrder: catchAsyncErrors(async (req, res, next) => {
        await order_model.findById(req.params.id).populate(
            "user",
            "name email"
        ).then((order) => {
            if (order) {
                res.status(200).json({
                    success: true,
                    order,
                })
            } else {
                return next(new ErrorHander("Order not found with this Id", 404));
            }
        })
    }),
    //user can see only thier order
    myOrders: catchAsyncErrors(async (req, res, next) => {
        await order_model.find({ user: req.user._id }).exec()
            .then((order) => {
                if (order) {
                    res.status(200).json({
                        success: true,
                        order,
                    })
                } else {
                    return next(new ErrorHander("Order not found with this Id", 404));
                }
            })
    }),
    //by admin see all order
    getAllorders: catchAsyncErrors(async (req, res, next) => {
        await order_model.find({}).exec()
            .then((_order) => {
                let totalAmount = 0;

                _order.forEach((order) => {
                    totalAmount += order.totalPrice;
                })

                res.status(200).json({
                    success: true,
                    totalAmount,
                    _order,
                })
            })
    }),
    //update order --admin
    updateOrder: catchAsyncErrors(async (req, res, next) => {
        const order = await order_model.findById(req.params.id);

        if (!order) {
            return next(new ErrorHander("Order not found with this Id", 404));
        }

        if (order.orderStatus === "Delivered") {
            return next(new ErrorHander("You have already delivered this order", 400));
        }

        if (req.body.status === "Shipped") {
            order.orderItems.forEach(async (o) => {
                await updateStock(o.product, o.quantity);
            });
        }
        order.orderStatus = req.body.status;

        if (req.body.status === "Delivered") {
            order.deliveredAt = Date.now();
        }

        await order.save({ validateBeforeSave: false });
        res.status(200).json({
            success: true,
        });
        async function updateStock(id, quantity) {
            const product = await produc_Model.findById(id);

            product.Stock -= quantity;

            await product.save({ validateBeforeSave: false });
        }
    }),

    //delete order --admin
    deleteOrder: catchAsyncErrors(async (req, res, next) => {
        await order_model.findByIdAndDelete(req.params.id).exec()
            .then((order) => {
                if (order) {
                    res.status(200).json({
                        success: true,
                    })
                } else {
                    return next(new ErrorHander("Order not found with this Id", 404));
                }
            })
    })


}