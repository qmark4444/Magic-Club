'use strict';

const createError = require('http-errors');
const express = require('express');
// const app = express();
const port = process.env.PORT || 9000;
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();
require('./config/passport_setup')(passport);//before app instance???

const app = express();

// set app title
app.set('title', 'Magic Club');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(flash());

app.use(logger('dev'));

//body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// connect to DB
mongoose.connect(process.env.DB_CONNECTION, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true
}).then(() => {
    console.log("Successfully connected to the database");    
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit(1);//exit node
});
var MongoDBStore = require('connect-mongodb-session')(session);
// declare a session store instance
var store = new MongoDBStore({
  uri: process.env.DB_CONNECTION, 
  collection: 'userSessions' //collection: the MongoDB collection to store sessions in. By default it's 'sessions'
}); 
// Catch errors 
store.on('error', function(error) {
  assert.ifError(error);
  assert.ok(false);
});

app.use(session({ 
  secret: 'QMLong secret',
  name: 'magicClub_session',
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1 day.
  },
  store: store,  // a session store instance = MongoDB connection session
  resave: true, 
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// to app routes
const appRouter = require('./routes/app');
const membersRouter = require('./routes/members');

app.use('/', appRouter);
app.use('/members', membersRouter);

//at last handle all errors
// app.use(function(req, res, next) {
//   next(createError(404)); // catch 404 and forward to error handler
// });

// // error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // console.error(err.stack)
  // res.status(500).send('Something broke!')
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, () => {
  console.log('Node Server is listening on port: ' + port);
  if (process.env.NODE_ENV !== 'production') {
      console.log('We are in development mode');
  }
});