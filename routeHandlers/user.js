
let User = require("../models/Member");
const passport = require('passport');
// let flash = require('connect-flash');
const {isEmpty} = require('lodash');
const { validateUser } = require('../validators/signup');

exports.show_login = function(req, res, next) {
	res.render('user/login', { formData: {}, errors: req.flash('loginErrorMessage') });
}

exports.show_signup = function(req, res, next) {
	res.render('user/signup', { formData: {}, errors: {} });
}

const rerender_signup = function(errors, req, res, next) {
	res.render('user/signup', { formData: req.body, errors: errors});
}

exports.signup = function(req, res, next) {
	let errors = {};
	return validateUser(errors, req).then(errors => {
		if (!isEmpty(errors)) {
			rerender_signup(errors, req, res, next);
		} else {
			return User.findOne({
				"local.isAdmin": true
			}).then(user => {
				let newUser;
				if (user !== null) {
					newUser = new User({
						"local.name": req.body.name,
						"local.email": req.body.email,
						"local.password": User.generateHash(req.body.password)
					});					
				} else {
					newUser = new User({
						"local.name": req.body.name,
						"local.email": req.body.email,
						"local.password": User.generateHash(req.body.password),
						"local.isAdmin": true
					});
				}
				return newUser.save().then(result => {
					console.log('result from sign up ', result);
					passport.authenticate('local', {
						successRedirect: "/",
						failureRedirect: "/signup",
						failureFlash: true
					})(req, res, next);
				})	
			})		
		}
	})
}

exports.login = function(req, res, next) { 
	passport.authenticate('local', {
		successRedirect: "/",
		failureRedirect: "/login",
		failureFlash: true
	})(req, res, next);
}

exports.logout = function(req, res, next) { 
	req.logout();
	req.session.destroy();//need express-session, if just cookie-session then TypeError: req.session.destroy is not a function
	res.redirect('/');

	// req.session.destroy( function (err) {
    //     req.session = null;
    //     // res.clearCookie(); // need to clear cookie?
    //     // res.clearCookie('magicClub_session');//session name set in app.js
    //     setTimeout(function () {
    //         res.redirect('/');
    //     }, 0);
    // });
}

