'use strict';
//set company email SMTP host server
//this file is required in page-renders.js for email verification or notification (forgotPost, resetPost, signupPost)

var nodemailer = require('nodemailer');
var nodeSMTPtransport = require('nodemailer-smtp-transport');
var companyEmailAddress = 'welcome@trendifylive.com';//'tl2017test@gmail.com';

/*
var smtpTransport = nodemailer.createTransport(nodeSMTPtransport({
    host: 'smtp.gmail.com', 
    service: 'Gmail',
    auth: {
        user: companyEmailAddress,
        pass: 'TLisfriendly2017!!!%'
    }
}));
//*/

///*
var smtpTransport = nodemailer.createTransport(nodeSMTPtransport({
    service: 'Godaddy',
    host: "smtpout.secureserver.net",  
    secure: false,
    port: 3535, 
    auth: {
        user: companyEmailAddress, 
        pass: "TLACTeam2018%" 
    },
}));
//*/

exports.companyEmail = function (fromEmail, toEmail, subject, text, messageTitle, messageBody, redirectURL, req, res) {

    var mailOptions = {
        from: fromEmail, //can be company email, e.g. 'support@trendifylive.com'
        to: toEmail, // can be client's email
        subject: subject,// e.g. email title, as 'Reset your password....'
        text: text //e.g. email content, as 'Please reset the password in 1 hour.....'
    };
    
    smtpTransport.sendMail(mailOptions, function (err, response) {
        if (err) {
            console.log(err);
            res.end();//end response, don't waste time reading response header
        }
        else {
            console.log(response);
            req.flash(messageTitle, messageBody); // message to be displayed on the next page (i.e. redirectURL page)
            res.redirect(redirectURL);
        }

        smtpTransport.close();
    });  

}; 

exports.companyMobileEmail = function (fromEmail, toEmail, subject, text, message, status, res) {

    var mailOptions = {
        from: fromEmail,
        to: toEmail, 
        subject: subject,
        text: text
    };
    
    smtpTransport.sendMail(mailOptions, function (err, response) {
        if (err) {
            console.log(err);
            //not add response to http?
            res.json({
                [message]: 'Error in smtp server sending email',//[var] => dynamic property name
                [status]: false
            });
        }
        else {
            console.log(response);
            //the following has no effect? HTTP still sees no response! why?
            //res.json({
            //    [message]: 'Verification email sent',
            //    [status]: true
            //});
        }

        smtpTransport.close();
    });  

};              