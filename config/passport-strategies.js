'use strict';
//set up strategies for passport configuration

const LocalStrategy = require('passport-local').Strategy;
const GuestStrategy = require('passport-guest').Strategy;// added in version 7
const FaceBookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const AdminStrategy = require('passport-admin').Strategy;

// load up the client model for client database manipulation
const User = require('../app/models/client-model');
const configAuth = require('./auth.js');
//'var' or 'const'?
//'const' is immutable for primitives (numbers, strings, boolean). For objects and arrays it can't be reassigned (like 'final' in Java), but the contents can be changed (e.g. array.push)
const Admin = require('../admin/models/admin-model.js');

// expose this function to our app using module.exports
module.exports = function(passport) {

    /** passport session setup - required for persistent login sessions: 
    * "persistent" means user will stay login while navigate between different pages during the same session
    */
    
    // passport needs ability to serialize and unserialize users out of session
    // used to serialize the user for the session: serialize an object (i.e. user.id) = store an object to an I/O stream
    passport.serializeUser(function(user, done) {
        done(null, user.id);  //Error: Can't set headers after they are sent. at serialized ... at ...passport-strategies.js:24:9

    });

    // used to deserialize the user: deserialize a stream = read the object stored in the stream 
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    //set up 'local-signup' strategy ============================================================
    passport.use('local-signup', new LocalStrategy({ 
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {

            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick( function() {

                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                
                //User.findOne({"local.username":email //WRONG: This line allows duplicated email to signup!!!!
                User.findOne({"local.email":email}, function(err, user) {
                    // if there are any errors, return the error
                    if (err) { return done(err); }

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email has already been taken'));
                    } else {

                        // if there is no user with that email, create the user
                        var newUser = new User();

                        // set the user's local credentials
                        newUser.local.email = email;
                        newUser.local.password = newUser.generateHash(password);

                        // save the user
                        newUser.save(function(err) {
                            if (err)
                                //throw err; //throw err will terminate the dbrest.js
                               //instead, use the following block
                            { 
                                console.log('Error in saving client data!');
                                return done(err);
                            }

                            return done(null, newUser);
                        });
                    }

                });

            });

        }));

    //set up 'local-login' strategy =============================================================
    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            
            User.findOne({"local.email":email}, function(err, user) {
                // if there are any errors, return the error before anything else
                if (err) { return done(err); }

                // if no user is found, return the message
                if (!user) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }

                // if the user is found but the password is wrong
                if (!user.validPassword(password)) {
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.' )); // create the loginMessage and save it to session as flashdata
                }

                // if the user is disabled
                if (user.isDisabled) {
                    return done(null, false, req.flash('loginMessage', 'You are disabled, contact TL administrator for more information.' ));
                }

                // all is well, return successful user
                return done(null, user);
            });

        }));

    //set up 'admin-login' strategy xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    passport.use('admin-login', new AdminStrategy({
            usernameField: 'name',
            passwordField: 'password',
            passReqToCallback: true 
        },
        function(req, name, password, done) { 
            //Admin.findOne({"admins": {$elemMatch: {"name": name} } }, function(err, admin) {
                //$elemMatch for finding an array element --> admins:[{name:, password:}, {name:, password:}]
            Admin.findOne({"name": name}, function(err, admin) {
                if (err) { return done(err); }
                if (!admin) {
                    return done(null, false, req.flash('adminloginMessage', 'No admin found.')); 
                }
                if (!Admin.validPassword(admin, password)) {
                    return done(null, false, req.flash('adminloginMessage', 'Oops! Wrong password.' ));
                }
                return done(null, admin);
            });

        }
    ));
    //xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    //set up 'guest-login' strategy =============================================================
    passport.use('guest-login', new GuestStrategy({ 
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, done) { //this function is from passport-guest strategy.js

            console.log('Guest log in starts');
            
            User.findOne({"guest.username": 'guest'}, function(err, user) {
                if (err) { return done(err); }

                if (!user) {
                    var newGuest = new User();
                    newGuest.guest.username = "guest";
                    newGuest.guest.count = 1;

                    newGuest.save( function (err){
                        //req.flash('loginMessage', 'Something wrong when saving guest info');//wrong: hang!
                        console.log('a new guest added');
                        done(err, newGuest);
                    });
                    //return done(null, false, req.flash('loginMessage', 'No guest found.')); // req.flash is the way to set flashdata using connect-flash
                    return;
                }

                if (!user.guest.count) {
                    console.log('guest count not exist');
                    //return done(null, false, req.flash('loginMessage', 'Strange! No guest count' )); // create the loginMessage and save it to session as flashdata
                    return;
                }

                console.log('guest count increment by 1');
                user.guest.count++;
                user.save( function (err){
                    //req.flash('loginMessage', 'Something wrong when saving guest info');//wrong: hang!
                    //done(err, user);
                });
                return done(null, user);//TypeError: done is not a function, why?
            });

        }));

    //////////// Face book login
    passport.use(new FaceBookStrategy({
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL,
            profileFields: ['id', 'emails', 'first_name', 'last_name', 'displayName', 'link', 'photos'],
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function(req, token, refreshToken, profile, done) { 
            //asynchronous
            process.nextTick(function() {
                if (!req.user) {
                    console.log('req.user does not exist');
                    //find the user in the database by their facebookid
                    User.findOne({
                        'facebook.id': profile.id
                    }, function(err, user) {
                        //if there is an error, stop all
                        if (err) return done(err);
                        //if user is found,then login the user
                        if (user) {



                            // if there is a user id already but no token (user was linked at one point and then removed)
                            // just add our token and profile information
                            if (!user.facebook.token) {
                                user.facebook.token = token;
                                user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                                user.facebook.email = profile.emails[0].value;

                                user.save(function(err) {
                                    if (err)
                                        throw err;
                                    return done(null, user);
                                });
                            }
                            return done(null, user); // user found, return that user

                        } else {
                            //if no user is found that create a new user with that facebook id
                            var newUser = new User();
                            //set all of the facebook information in our model
                            newUser.facebook.id = profile.id //set userid to be the facebook id
                            newUser.facebook.token = token;
                            newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                            newUser.facebook.email = profile.emails[0].value;

                            //add tracking in version 9 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                            User.findOne({'tracking': {$exists: true}}).sort({'tracking.count': -1}).exec( function (err, lastUser){
                                if(err) {
                                    console.log('query tracking property in client db failed');
                                    res.end();
                                }
                                if(!lastUser){ 
                                    console.log('last user is null');
                                    newUser.tracking.count = 1;
                                    newUser.tracking.trackId = "0001";
                                }
                                else {
                                    console.log('last user found');
                                    newUser.tracking.count = lastUser.tracking.count + 1;
                                    newUser.tracking.trackId = User.setTrackID( newUser.tracking.count );
                                }

                                newUser.save(function(err) {
                                    if (err)
                                        throw err;
                                    //if successful,return the new User
                                    return done(null, newUser);
                                });

                            });
                            //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

                            /*//comment out in version 9 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                //if successful,return the new User
                                return done(null, newUser);
                            });
                            //*/

                        }
                    });

                } else {
                    console.log('req.user: ', req.user);
                    // user already exists and is logged in, we have to link accounts
                    var user = req.user; // pull the user out of the session

                    // update the current users facebook credentials
                    user.facebook.id = profile.id;
                    user.facebook.token = token;
                    user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                    user.facebook.email = profile.emails[0].value;

                    // save the user 
                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });
                }
            });
        }));

    /////////// twitter login
    passport.use(new TwitterStrategy({
            // clientID     : configAuth.twitterAuth.clientID,
            // clientSecret : configAuth.twitterAuth.clientSecret,
            // callbackURL  : configAuth.twitterAuth.callbackURL
            consumerKey: configAuth.twitterAuth.consumerKey,
            consumerSecret: configAuth.twitterAuth.consumerSecret,
            callbackURL: configAuth.twitterAuth.callbackURL,
            passReqToCallback: true
        },
        function(req, token, refreshToken, profile, done) { //"twitter":{"displayName":"....","id":"....","username":"...","token":"..." }
            //asynchronous
            process.nextTick(function() {
                //find the user in the database by their twitter id
                if (!req.user) {
                    User.findOne({
                        'twitter.id': profile.id
                    }, function(err, user) {
                        //if there is an error, stop all
                        if (err) return done(err);
                        //if user is found,then login the user
                        if (user) {
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            // just add our token and profile information
                            if (!user.twitter.token) {

                                //handle internet connection failure =======
                                //if(!token || !(profile.name.username) || !(profile.displayName)){ //doesn't work: TypeError: Cannot read property 'username' of undefined
                                if(!token || !(profile.username) || !(profile.displayName)){ 
                                //if(!profile.token || !(profile.username) || !(profile.displayName)){ 
                                    return done(null, false, req.flash('signupMessage', 'internet connection failed, please re-signup with Twitter'));
                                }
                                //==============================================

                                user.twitter.token = token; // no 'token' property in db --> change this 
                                //user.twitter.token = profile.token; 

                                //user.twitter.username = profile.name.username;//change here too according to if()?
                                user.twitter.username = profile.username;
                                user.twitter.displayName = profile.displayName;

                                //update, not insert new user
                                user.save(function(err) {
                                    if (err) {
                                        //throw err; // internet connection failure won't throw this err! this err is only caused by save data
                                        return done(null, false, req.flash('signupMessage', 'save client data failed, please re-signup with Twitter'));
                                    }
                                    return done(null, user);
                                });
                            }
                            return done(null, user); // user found, return that user


                        } else {
                            //if no user is found that create a new user with that twitter id
                            var newUser = new User();
                            // //set all of the twitter information in our model
                            // newUser.twitter.id    = profile.id//set userid to be the twitter id
                            // newUser.twitter.token = token;
                            // newUser.twitter.name  = profile.name.givenName+ ' '+profile.name.familyName;
                            // newUser.twitter.email = profile.emails[0].value;
                            // set all of the user data that we need
                            newUser.twitter.id = profile.id;
                            newUser.twitter.token = token;//original
                            //newUser.twitter.token = profile.token;
                            newUser.twitter.username = profile.username;
                            newUser.twitter.displayName = profile.displayName;

                            //set tracking: version 9 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++=
                            User.findOne({'tracking': {$exists: true}}).sort({'tracking.count': -1}).exec( function (err, lastUser){
                                if(err) {
                                    console.log('query tracking property in client db failed');
                                    res.end();
                                }
                                if(!lastUser){ 
                                    console.log('last user is null');
                                    newUser.tracking.count = 1;
                                    newUser.tracking.trackId = "0001";
                                }
                                else {
                                    console.log('last user found');
                                    newUser.tracking.count = lastUser.tracking.count + 1;
                                    newUser.tracking.trackId = User.setTrackID( newUser.tracking.count );
                                }

                                newUser.save(function(err) {
                                    if (err)
                                        throw err;
                                    //if successful,return the new User
                                    return done(null, newUser);
                                });

                            });

                            /*//comment out in version 9 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                //if successful,return the new User
                                return done(null, newUser);
                            });
                            //*/

                        }
                    });
                } else {
                    console.log('twitter req.user: ', req.user);
                    // user already exists and is logged in, we have to link accounts
                    var user = req.user; // pull the user out of the session

                    // update the current users facebook credentials
                    user.twitter.id = profile.id;
                    user.twitter.token = token;
                    user.twitter.username = profile.username;
                    user.twitter.displayName = profile.displayName;

                    // save the user 
                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });

                }
            });
        }));

};
