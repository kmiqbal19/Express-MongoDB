const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();
// VIEW ENGINE WITH PUG
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// Serving static files

app.use(express.static(path.join(__dirname, 'public')));
// GLOBAL MIDDLEWARES

// Set Security HTTP Headers
app.use(helmet());
// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in an hour!'
});
app.use('/api', limiter);
// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());
// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});
// BASE ROUTES
app.get('/', (req, res) => {
  res.status(200).render('base', {
    title: 'Exciting tours for adventurous people',
    user: 'Iqbal'
  });
});
app.get('/overview', (req, res) => {
  res.status(200).render('overview', {
    title: 'All Tours'
  });
});
app.get('/tour', (req, res) => {
  res.status(200).render('tour', {
    title: 'The Forest Hiker'
  });
});
// MOUNTING ROUTER FOR DIFFERENT ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
// Error Handling for Invalid Url by using Middleware
app.all('*', (req, res, next) => {
  next(
    new AppError(`Couldn't find this ${req.originalUrl} in this server!`, 404)
  );
});
app.use(globalErrorHandler);
module.exports = app;
