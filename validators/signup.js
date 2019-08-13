let User = require('../models/Member');

let validator = require('validator');


const validateCreateUserFields = function(errors, req) {
	if (/^\s*$/.test(req.body.name)) {
		errors["name"] = "Please enter a valid name.";
	}
	if (!validator.isEmail(req.body.email)) {
		errors["email"] = "Please use a valid email.";
	}
	if (!validator.isAscii(req.body.password)) {
		errors["password"] = "Invalid characters in password, please try another one.";		
	}
	if (!validator.isLength(req.body.password, {min: 8, max: 25})) {
		errors["password"] = "Please ensure that your password has a minimum of 8 characters";
	}
}

exports.validateUser = function(errors, req) {
	return new Promise( (resolve, reject) => {
		validateCreateUserFields(errors, req);
		return User.findOne({
			"local.email": req.body.email
		}).then(u => {
			if (u !== null) {
				errors["email"] = "Email is already in use. Please login or reset your password";
			}
			resolve(errors);
		})
		// .catch( err => {
		// 	reject(err); //not handled
		// })

		//.then replace with async/await + try/catch?
		// or, (req, res, next) => Promise.resolve().then().catch(next)
	})
}