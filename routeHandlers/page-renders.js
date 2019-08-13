//render all needed pages, the flash messages are defined in passport-strategies.js

'use strict';

const User = require('../models/client-model.js');
const Admin = require('../../admin/models/admin-model.js');
const TempUser = require('../models/temp-client-model.js');

const async = require('async')
    , crypto = require('crypto')
    , bcrypt = require('bcrypt-nodejs');

var companySMTP = require('./company-smtp.js');
var fromEmail = 'welcome@trendifylive.com';

//launch login page in response: 
exports.login = function (req, res) {
    // render the page and pass in any flash data if it exists
    res.render('login.ejs', {message: req.flash('loginMessage')});//to show message after redirect to this page, the route message name must be 'loginMessage'
};

//admin login GET 
exports.adminLogin = function (req, res) {
    res.render('admin-login.ejs', {message: req.flash('adminloginMessage')});
};//Error: Failed to lookup view "admin-login.ejs" in views directory "/home.../TrendifyLive-app/admin/views"

//admin monitor launcher 
exports.adminMonitor = function (req, res) {
    res.render('admin-monitor.ejs', {
    });
};

//launch index page in response:
/*//not used any more ???????????????????????????????
exports.root = function (req, res) {
    res.render('index.ejs', {message: req.flash('info')}); // load the index.ejs file
};
//*/

//launch signup page in response:
exports.signup = function (req, res) {
    // render the page and pass in any flash data if it exists
    res.render('signupMin.ejs', {message: req.flash('signupMessage')});//new v28: signup minify/////////////////////
};

//launch profile page after signup
exports.profile = function (req, res) {
    res.render('profile.ejs', {
        user: req.user // get the user out of session and pass to template
        //after successful signup, user data is stored in http request 
    });
};

//launch user page after successful login
exports.user = function (req, res) {
    //console.log('in user.ejs, ', req.user);//for debugging
    var userExist = req.user? 'True': 'False';
    //console.log('req.user exist? ' + userExist);//for debugging

    //res.render('user.ejs', {
    res.render('userMin.ejs', { //new v27: user.ejs minify ////////////////////////////////////////////////
        user: req.user // get the user out of session and pass to template
        //after successful login, user data is stored in http request 
    });
};

//save events to user document 
exports.saveEvents = function (req, res){
    var query;
    query = {'tracking.trackId': req.params.trid};

    var mode = req.params.mode;

    switch(mode){ 
        case "events":
            User.findOneAndUpdate(query, {$set: {"events": req.body}}, {new: true}, function(err, updatedUser){ 
                res.json(updatedUser.events);
            });
            break;
        case "operation":
            User.findOneAndUpdate(query, {$set: {"operation": req.body}}, {new: true}, function(err, updatedUser){    
                res.json(updatedUser.operation);
            });
            break;
        default:
            console.log('warning: events/daily operation not saved');
    }

};

exports.saveDaily = function (req, res){
    User.findOneAndUpdate({'tracking.trackId': req.params.trid}, {$set: {"dailyOperation": req.body}}, {new: true}, function(err, updatedUser){ 
        res.json(updatedUser.dailyOperation);
    });
};

exports.saveForwardingTable = function (req, res){
    Admin.findOneAndUpdate({'name': 'TL-Admin'}, {$set: {"forwardingTable": req.body}}, {new: true}, function(err, updatedAdmin){ 
        res.json(updatedAdmin.forwardingTable);
    });
};

exports.deleteTerm = function (req, res){
    var query = {'tracking.trackId': req.params.trid};
    switch(req.params.operate){ 
        case "event":
            
            break;
        case "daily":
            User.findOneAndUpdate(query, {$set: {"dailyOperation": req.body}}, {new: true}, function(err, updatedUser){  
                //console.log('deleting a daily operation term succeeds');  
                res.json(updatedUser.dailyOperation);
            });
            break;
        default:
            console.log('warning: deleting term not saved');
    }
};

exports.logout = function (req, res){

    req.logOut();
    req.session.destroy(function (err) {

        req.session = null;//add this to further destroy seesion
        //req.sessionStorage.clear();//TypeError: Cannot read property 'clear' of undefined
        res.clearCookie();//only clear session isn't enough, cookie is still there!
        res.clearCookie('TrendifyLive_Twitter_App_Session');//only clear this session?

        //console.log('after session destroyed, show cookies', req.cookies);//works for debug

        setTimeout(function () {
            res.redirect('/');
        }, 2000);//redirect after 2 seconds (2000ms)

    });
};

//launch guest page after successful login
exports.guest = function (req, res) {
    var guestExist = req.user? 'True': 'False';
    //console.log('guest exist? ' + guestExist);//for debugging
    
    res.render('guest.ejs', {
        user: req.user 
    });
};

//launch guest profile page
exports.guestProfile = function (req, res) {
    res.render('guestProfile.ejs', {
        user: req.user 
    });
};

//show user data in browser
exports.currentuserinfo = function (req, res) {
    //console.log('currentuserinfo = ' + req.user);//debug
    res.json(req.user);
};

//launch forgot (password) page
exports.forgot = function (req, res) {
    res.render('forgot.ejs', {message: req.flash('forgotMessage')});
};

//process forgot page: update client's reserpasswordXXXX fields, then send a notification email to client
exports.forgotPost = function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                return done(err, token); //return token if no error and pass to next function: waterfall!
            });//firstly generate a random token
        },

        function (token, done) {
            User.findOne({'local.email': req.body.email}, function (err, user) {
                //Mongoose will not throw any errors by default if you use a model without connecting.
                //Mongoose buffers model function calls internally. This buffering is convenient, but also a common source of confusion. 
                if (!user) {

                    req.flash('forgotMessage', 'no such user');
                    return res.redirect('/forgot'); // in routes.js, go to "app.get('/forgot', pageRenders.forgot);" which is defined above

                } 
                else {
                    user.local.resetpasswordToken = token;
                    user.local.resetpasswordExpires = Date.now() + 60 * 60 * 1000;// 1 hour
                    user.save(function (err) {
                        return done(err, token, user);//return token user;
                    });
                }
            });//set up client's resetpasswordToken/Expires fields, and update the client database for later comparison
        },

        function (token, user, done) {

            var toEmail = user.local.email;
            var subject = 'Reset your password with your TrendifyLive account';
            var text = 'Please reset your password with TrendifyLive (https://' + req.headers.host + 
                ') in one hour\n\n' + 'https://' + req.headers.host + '/reset?token=' + token + '\n\n' +
                "If the link doesn't connect, close the pop up window and click the link again";
            var messageTitle = 'forgotMessage';
            var messageBody = 'An email has been sent to ' + user.local.email + ', please follow the instructions to reset your password. You can close this window now';
            var redirectURL = '/forgot';
            companySMTP.companyEmail(fromEmail, toEmail, subject, text, messageTitle, messageBody, redirectURL, req, res);

        }], 

        function (err) {
            res.redirect('/forgot');
        }
    );
};

//show reset password page
exports.reset = function (req, res) {
    console.log('reset req.query.token = ' + req.query.token);
    //resetpasswordExpires
    User.findOne({'local.resetpasswordToken': req.query.token, 'local.resetpasswordExpires': {$gt: Date.now()}},
        function (err, user) {
            if (!user) {
                req.flash('forgotMessage', 'Password reset failed, reset token could be expired or have already been used');
                return res.redirect('/forgot');
            } 
            else {
                res.render('resetMin.ejs', {user: req.user, message: req.flash('resetMessage')});//new v28: reset minify ////////
            }
        });
};

//process reset password page
exports.resetPost = function (req, res) {
    console.log('resetPost req.query.token = ' + req.query.token);
    async.waterfall([
        function (done) {
            User.findOne({
                'local.resetpasswordToken': req.query.token,
                'local.resetpasswordExpires': {$gt: Date.now()}
            }, 

            function (err, user) {
                if (!user) {

                    req.flash('forgotMessage', 'Error: Password reset token could be expired or have already been used');
                    return res.redirect('forgot');

                }
                else if (req.body.confirm === req.body.password) {
                    //encrypt the reset password as the new password
                    user.local.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
                    user.local.resetpasswordToken = undefined;//reset the resetpasswordToken
                    user.local.resetpasswordExpires = undefined;//reset the resetpasswordExpires
                    user.save(function (err) {
                        req.logIn(user, function (err) {
                            done(err, user);
                        });
                    });//update client database
                } 
                else {
                    console.log(req.body.confirm + 'req.body.confirm === req.body.password ' + req.body.password);
                    return;
                }
            });
        },

        function (user, done) {
            
            var toEmail = user.local.email;
            var subject = 'Confirm that you have reset your password with your TrendifyLive account';
            var text = 'This is to confirm that your password has successfully been reset, your email is ' + user.local.email;
            var messageTitle = 'loginMessage';
            var messageBody = 'Success! your password has been reset';
            var redirectURL = '/login';
            companySMTP.companyEmail(fromEmail, toEmail, subject, text, messageTitle, messageBody, redirectURL, req, res); 

        }],

        function (err) {
            res.redirect('/');
        }
    );
};

exports.changePassword = function (req, res) {
    var email = req.body.email;
    var currentPassword = req.body.currentPassword;
    var newPassword = req.body.newPassword;
    User.findOne({"local.email":email}, function(err, user) {
        if (err) { 
            res.json({'message': 'Can not find you in our database. We are working on it'}); 
        }

        else if (!user.validPassword(currentPassword)) {
            res.json({'message': "Password not in our record"});
        }
        else {
            user.local.password = bcrypt.hashSync(req.body.newPassword, bcrypt.genSaltSync(8), null);
            user.save( function (err) {
                if(err) { 
                    res.json({'message': 'Wrong in process saving new password. Please try again'}); 
                }
                else
                    res.json({message: 'Changing password succeeds'});
            });
        }
    });
};

//Q.M.Long add the following to handle sign up email verification ======================
//process signup page: update client's urlXXX fields, then send a verification email to client

exports.signupPOST = function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var urlToken = buf.toString('hex');
                return done(err, urlToken); //return token if no error and pass to next function: waterfall!
            });//firstly generate a random toke

        },

        function (urlToken, done) {
            //if input email is already in persistent client database, don't allow continue
            User.findOne({"local.email":req.body.email}, function(err, user) {
                // if there are any errors, return the error
                if (err) { 
                    return done(err); 
                }

                // check to see if theres already a user with that email
                if (user) {                
                    req.flash('signupMessage', 'The email already exists in our record');
                    res.redirect('/signup');
                } 
                else {//the input email is new, so set up temp client's fields, and update the temp client database for later comparison

                    var tempUser = new TempUser();
                    tempUser.local.email = req.body.email;
                    tempUser.local.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
                    tempUser.local.urlToken = urlToken;
                    tempUser.local.urlCreatedAt = Date.now();
                    tempUser.save(function (err) {
                        return done(err, urlToken, tempUser);
                    });
                }
            });
        },

        function (urlToken, tempUser, done) {

            var toEmail = tempUser.local.email;
            var subject = 'Verify your email with TrendifyLive';
            var text = 'Thank you for signing up to TrendifyLive (https://' + req.headers.host +
                '). TrendifyLive brings to you public reaction to local events, what are the popular tweets, and many more.\n\n' + 
                'To verify your email, please click the following link, the link is valid for one hour\n\n' + 
                'https://' + req.headers.host + '/VerifyEmail/' + urlToken + '\n\n';
            var messageTitle = 'signupMessage';
            var messageBody = 'A verification email has been sent to ' + tempUser.local.email + ', please follow the instructions to complete sign up. You can now close this window';
            var redirectURL = '/signup';
            companySMTP.companyEmail(fromEmail, toEmail, subject, text, messageTitle, messageBody, redirectURL, req, res); 

        }], 

        function (err) {
            res.redirect('/signup');
        });
};

exports.signupVerifyEmail = function (req, res, next) {
    //user async 
    async.waterfall([
            function (done) {
                TempUser.findOne({'local.urlToken': req.params.urlToken}, function (err, tempUser) {
                    //if multiple click link: new v30/////////////////////////////
                    if(!tempUser){
                        return done('Signup link expired either due to multiple clicks or time elapse');
                    }

                    console.log("Found temp user, its local.email = " + tempUser.local.email);
                    return done(err, tempUser);                    
                });
            },

            function (tempUser, done){
                var user = new User();
                user.local.email = tempUser.local.email;
                user.local.password = tempUser.local.password;

                User.findOne({'tracking': {$exists: true}}).sort({'tracking.count': -1}).exec( function (err, lastUser){
                    if(err) {
                        console.log('query tracking property in client db failed');
                        //return res.end();
                        return done(err);
                    }
                    else if(!lastUser){ 
                        console.log('last user is null');
                        user.tracking.count = 1;
                        user.tracking.trackId = "0001";
                    }
                    else {
                        console.log('last user found');
                        user.tracking.count = lastUser.tracking.count + 1;
                        user.tracking.trackId = User.setTrackID( user.tracking.count );
                        //add default terms when created
                        user.dailyOperation = ["#ottawa"];
                        user.events = [{name:"city",activated:true,terms:[{name:"#ottawa",activated:true}]}];
                    }

                    user.save( function (err, user) {
                        return done(err, tempUser, user);
                    });

                });
            },

            function (tempUser, user, done) {
                TempUser.findOneAndRemove({'local.urlToken': req.params.urlToken}, function(err) {
                    if(err) { 
                        console.log('something wrong in removing the temp user from temp client database');
                        return done(err); 
                    }
                });

                // after email verification go to login page
                req.flash('loginMessage', 'Your email is verified, please log in now');
                res.redirect('/login');
            }

        ], 

        function (err) {
            console.log('email verification error: no tempUser, the link might be expired, or email has already been verified, or last user null, or user save error');
            req.flash('signupMessage', 'Error: your link might be expired, or your email has already been verified');
            res.redirect('/signup');
        }
    );
    
};

//for mobile REST API ==============================================================================

var jwt = require('jsonwebtoken');
const tokenSecret = 'TrendifyLiveMobile';

exports.mobileLogin = function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    User.findOne({"local.email": email}, function(err, user) {
        if (err) { 
            res.json({'message': 'Error in retrieving user'}); 
        }

        else if (!user || user === undefined) { 
            res.json({'message': 'Can not find the user'}); 
        }

        else if (!user.validPassword(password)) {
            res.json({'message': "Password not match"});
        }

        else {
            //generate token field: JWT is a string = header.payload.signature 
            var payload = {
                "email": email, 
            };//payload will be coerced into a string using JSON.stringify, if it is not a buffer or a string

            var token = jwt.sign(payload, tokenSecret, { //sign = signature

              expiresIn: 24 * 60 * 60,//one day in seconds

            });//no callback

            //send back token
            res.json({
                message: 'mobile token created',
                mobileToken: token,
                user: user, 
            });
        }
    });
};

var verifiedToken = function (req) {

    var token = req.headers['x-access-token'];
    var email = req.headers['email'];
    var verified = false;

    if(token){

        //decode token 
        jwt.verify(token, tokenSecret, function(err, decoded) {  

            if (err) {
                console.log('error in token');
            }

            else if (email === decoded.email){
                //console.log('token is verified');
                verified = true;
            }

            else{
                console.log('token email not match');
            }    

        });

    }

    return verified;

};

// route middleware to make sure a user is logged in
exports.isLoggedIn = function (req, res, next) { 

    if(req.isAuthenticated() || verifiedToken(req)){
        return next();
    }

    // if they aren't, redirect them to the home page
    console.log('verifiedToken(req) = ' + verifiedToken(req));
    res.redirect('/login');
};

exports.mobileSignup = function (req, res, next) {
    var message = 'signupMessage';
    var status = 'signupStatus';

    async.waterfall([
        function (done) {
            crypto.randomBytes(3, function (err, buf) {
                var urlToken = buf.toString('hex');
                return done(err, urlToken);
            });

        },

        function (urlToken, done) {
            User.findOne({"local.email":req.body.email}, function(err, user) {
                if (err) { 
                    return done(err);
                    //if error -> skip all following functions and go stright to main allback function (err)
                }

                // check to see if theres already a user with that email
                if (user) {
                    res.json({
                        [message]: 'The email already exists in our record',
                        [status]: false
                    });

                } 
                else {
                    var tempUser = new TempUser();
                    tempUser.local.email = req.body.email;
                    tempUser.local.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
                    tempUser.local.urlToken = urlToken;
                    tempUser.local.urlCreatedAt = Date.now();
                    tempUser.save(function (err) {
                        return done(err, urlToken, tempUser);
                    });
                }
            });
        },

        function (urlToken, tempUser, done) {
            var toEmail = tempUser.local.email;
            var subject = 'Verify your email with TrendifyLive';
            var text = 'Send the following code to verify your email, the code is valid for one hour\n\n' + urlToken + '\n\n';
            companySMTP.companyMobileEmail(fromEmail, toEmail, subject, text, message, status, res); 

            res.json({
                [message]: 'Verification email sent',
                [status]: true
            });

        }], 

        function (err) {
            res.json({
                [message]: 'Error in mobile signing up',
                [status]: false
            });
        });
};

exports.mobileVerifySignup = function (req, res, next) {
    var message = 'signupMessage';
    var status = 'signupStatus';

    TempUser.findOne({'local.urlToken': req.body.mobileSignupToken}, function (err, tempUser) {
        if(err){
            res.json({
                [message]: 'email verification error: the code might be expired',
                [status]: false
            });

        }// multiple clicks of link => no err, but tempUser becomes null => cause error below
        else 
        {
            //need to first check tempUser is still there (in case of multiple clicks on link)
            if(!tempUser){
                res.json({
                    [message]: 'Either your code has expired Or is wrong Or your email has already been verified',
                    [status]: false
                });
            }
            else
            {
                //move the temp user to persistent client database, and delete the temp user from temp client database
                var user = new User();
                user.local.email = tempUser.local.email;
                user.local.password = tempUser.local.password;

                //MongoDB transaction atomicity (1)
                //a write operation is atomic on the level of a single document, 
                //even if the operation modifies multiple embedded documents within a single document.
                //MongoDB concurrency (2)
                //Concurrency control allows multiple applications to run concurrently without causing data inconsistency or conflicts.
                User.findOne({'tracking': {$exists: true}}).sort({'tracking.count': -1}).exec( function (err, lastUser){
                    if(err) {
                        console.log('query tracking property in client db failed');
                        //res.end();
                        res.json({
                            [message]: 'query tracking property in client db failed',
                            [status]: false
                        });
                    }

                    else if(!lastUser){ 
                        console.log('last user is null');
                        user.tracking.count = 1;
                        user.tracking.trackId = "0001";
                    }
                    else {
                        console.log('last user found');//concurrency issue??????????????????????????
                        user.tracking.count = lastUser.tracking.count + 1;
                        user.tracking.trackId = User.setTrackID( user.tracking.count );
                        //add default terms when created
                        user.dailyOperation = ["#ottawa"];
                        user.events = [{name:"city",activated:true,terms:[{name:"#ottawa",activated:true}]}];
                    }

                    user.save( function (err) {
                        if(err) { 
                            res.json({
                                [message]: 'Code is valid, but something wrong in saving new client. Please retry sign up',
                                [status]: false
                            });
                            return;
                        }
                    });

                });

                //remove temp user
                TempUser.findOneAndRemove({'local.urlToken': req.body.mobileSignupToken}, function(err) {
                    if(err) { 
                        console.log('something wrong in removing the temp user from temp client database');
                        return; 
                    }
                });

                res.json({
                    [message]: 'Your email is verified',
                    [status]: true
                });

            }
        }
        
    });

};

exports.mobileForgot = function (req, res, next) {
    var message = 'forgotMessage';
    var status = 'forgotStatus';

    async.waterfall([
        function (done) {
            crypto.randomBytes(3, function (err, buf) {
                var token = buf.toString('hex');
                //when error, should add return here, otherwise the second function in this function array will be called twice
                return done(err, token);
            });
        },

        function (token, done) {
            User.findOne({'local.email': req.body.email}, function (err, user) {
                if (!user) {
                    console.log('no user found');
                    res.json({ //stop here don't go to next function
                        [message]: 'no such user',
                        [status]: false
                    });

                } 
                else 
                {
                    return done(null, token, user);//callback has no error
                }
            });
        },

        function (token, user, done) {
            var toEmail = user.local.email;
            var subject = 'Reset your password with your TrendifyLive account';
            var text = 'Please send the following code and reset the password in 1 hour\n\n' + token + '\n\n';
            
            companySMTP.companyMobileEmail(fromEmail, toEmail, subject, text, message, status, res); 

            res.json({
                [message]: 'Verification email sent',
                code: token,
                [status]: true,
            });

        }], 

        function (err) {
            res.json({
                [message]: 'Error in mobile creating token to reset password',
                [status]: false
            });
        }
    );
};

exports.mobileForgotReset = function (req, res) {
    var message = 'forgotMessage';
    var status = 'forgotStatus';

    async.waterfall([
        function (done) {
            User.findOne({'local.email': req.body.email}, function (err, user) {
                if (!user) {
                    res.json({
                        [message]: 'no such user',
                        [status]: false
                    });

                }
                else
                {
                    //encrypt the reset password as the new password
                    user.local.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
                    user.save( function (err) {
                        return done(err, user);
                    });//update client database
                } 

            });
        },

        function (user, done) {
            var toEmail = user.local.email;
            var subject = 'Your TrendifyLive account password was just reset';
            var text = 'This is to confirm that your password has successfully been reset, your email is ' + user.local.email;
            
            companySMTP.companyMobileEmail(fromEmail, toEmail, subject, text, message, status, res); 

            res.json({
                [message]: 'Confirmation email sent',
                [status]: true
            }); 

        }], 

        function (err) {
            res.json({
                [message]: 'Error in mobile reseting password process',
                [status]: false
            }); 
        }
    );
};