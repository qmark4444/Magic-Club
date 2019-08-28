
let LocalStrategy = require('passport-local').Strategy;

var bcrypt = require('bcrypt');
let User = require('../models/Member');

const validPassword = function(user, password) {
	return bcrypt.compareSync(password, user.local.password);
}
module.exports = function(passport) {
	passport.serializeUser(function(user, done) {
		done(null, user.id)
	});
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
            done(err, user);
		});	
	});
	passport.use(
		new LocalStrategy(
			{
				usernameField: 'email', 
				passwordField: 'password',
				passReqToCallback: true
			},
			function(req, email, password, done) {
				return User.findOne({
					"local.email": email
				}).then(user => {
					if (user == null) {
						req.flash('message', 'Incorrect credentials.')
						return done(null, false)
					} else if (!user.local.active) {
						req.flash('message', 'Your account is suspended, contact administration for more information')
						return done(null, false)
					} else if (user.local.password == null || user.local.password == undefined) {
						req.flash('message', 'You must reset your password')
						return done(null, false)
					} else if(!validPassword(user, password)) {
						req.flash('message', 'Incorrect credentials')
						return done(null, false)
					}
					return done(null, user);
				}).catch(err => {
					done(err, false);
				})
			}
		)
	)
}