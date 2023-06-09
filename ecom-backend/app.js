var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose=require('mongoose')
const key=require('./config/key')
var product_Route = require('./routes/product_Route');
var user_Route = require('./routes/user_Route');
var order_Route = require('./routes/order_Route');
var payment_Route=require('./routes/paymentRoute')
const errorMiddleware=require('./middleware/error')
const cors = require('cors')
var app = express();
const bodyp=require('body-parser')
const fileUpload=require('express-fileupload')
const cloudinary=require('cloudinary')

mongoose.connect(key.url, (err, db)=>{
    console.log("Connectiong to db")
})
  
app.use(cors({
  origin:'*'
}))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyp.urlencoded({extended:true}))
app.use(fileUpload())

cloudinary.config({
  cloud_name:'diwhevgwg',
  api_key:'791316125938235',
  api_secret:"cgEcvyMNuOOQ2aTXQHqUk3laspo"
})

app.use('/api/v1', product_Route);
app.use('/api/v1', user_Route);
app.use('/api/v1', order_Route);
app.use('/api/v1', payment_Route);


app.use(errorMiddleware)
app.listen(8080)