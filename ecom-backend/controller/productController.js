const Product = require('../models/produc_Model')
const ErrorHandler = require('../utils/errorhandler')
const catchAsyncErrors = require('../middleware/catchAsyncErrors')
const ApiFeatures = require('../utils/apifeatures')
const cloudinary = require("cloudinary");

module.exports = {

  //create Product

  createProduct: catchAsyncErrors(async (req, res, next) => {
    let images = [];

    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
    req.body.images = imagesLinks;

    req.body.user = req.user._id
    const _product = new Product(
      req.body
    )
    await _product.save().then((__product) => {
      res.status(200).json({
        success: true,
        __product
      })
    })
  }),

  //find all product

  getAllProducts: catchAsyncErrors(async (req, res) => {
    await Product.find().exec()
    .then(products => {
      res.status(200).json({
        success: true,
        products,
      });
    })

  }),

  //get Admin Product

  getAdminProducts: catchAsyncErrors(async (req, res, next) => {
    await Product.find().exec()
      .then(products => {
        res.status(200).json({
          success: true,
          products,
        });
      })
  }),

  //get Product 

  getProductDetails: catchAsyncErrors(async (req, res, next) => {
    await Product.findOne({ _id: req.params.id }).exec().then((_product) => {
      if (_product) {
        res.status(200).json({
          success: true,
          _product
        })
      } else {
        return next(new ErrorHandler("Product not found", 404));
      }

    })
  }),

  //update product

  updateProduct: catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHander("Product not found", 404));
    }
  
    // Images Start Here
    let images = [];
  
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
  
    if (images !== undefined) {
      // Deleting Images From Cloudinary
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }
  
      const imagesLinks = [];
  
      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: "products",
        });
  
        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
  
      req.body.images = imagesLinks;
    }
  
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  
    res.status(200).json({
      success: true,
      product,
    });
  }),

  //delete product

  deleteProduct: catchAsyncErrors(async (req, res, next) => {
    await Product.findById(req.params.id).exec().then((_product) => {
      // Deleting Images From Cloudinary
    // for (let i = 0; i < product.images.length; i++) {
    //   cloudinary.v2.uploader.destroy(product.images[i].public_id);
    // }
      if (_product) {
        // Deleting Images From Cloudinary
        for (let i = 0; i < product.images.length; i++) {
          cloudinary.v2.uploader.destroy(product.images[i].public_id);
        }       
        Product.findByIdAndDelete({ _id: req.params.id })
          .exec().then((_productdelete) => {
            res.status(200).json({
              success: true,
              _productdelete
            })
          })
      } else {
        return next(new ErrorHandler("Product not found", 404));
      }
    })
  }),

  createProductReview: catchAsyncErrors(async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(
      (rev) => rev.user.toString() === req.user._id.toString()
    );

    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user.toString() === req.user._id.toString())
          (rev.rating = rating), (rev.comment = comment);
      });
    } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }

    let avg = 0;

    product.reviews.forEach((rev) => {
      avg += rev.rating;
    });

    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
    })
  }),

  // Get All Reviews of a product
  getProductReviews: catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  }),
  // Delete Review
  deleteReview: catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    const reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== req.query.id.toString()
    );

    let avg = 0;

    reviews.forEach((rev) => {
      avg += rev.rating;
    });

    let ratings = 0;

    if (reviews.length === 0) {
      ratings = 0;
    } else {
      ratings = avg / reviews.length;
    }

    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(
      req.query.productId,
      {
        reviews,
        ratings,
        numOfReviews,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json({
      success: true,
    })
  })
}