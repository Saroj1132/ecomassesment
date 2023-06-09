const catchAsyncErrors = require('../middleware/catchAsyncErrors')
const jwt=require('jsonwebtoken');
const user_Model = require('../models/user_Model');
const ErrorHandler = require('../utils/errorhandler');


    exports.isAuthentication=async (req, res, next)=>{
      const { token } = req.cookies;
      
      if (!token) {
        return next(new ErrorHandler("Please Login to access this resource", 401));
      }
    
      const decodedData = jwt.verify(token, 'mye1334');
    
      req.user = await user_Model.findById(decodedData.id);
    
      next();
  
  }, 

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new ErrorHandler(
            `Role: ${req.user.role} is not allowed to access this resouce `,
            403
          )
        );
      }
  
      next();
    };
  };