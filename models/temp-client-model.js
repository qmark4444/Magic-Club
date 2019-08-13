/* define temporary client data model for sign up. 
 * The user who fails to sign up before expiration time set here will be removed from this temporary database
 * one way = using MongoDB’s “time to live” or TTL collection feature to automatically remove expired data
*/
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// define the schema for the temporary client model
var tempUserSchema = mongoose.Schema({

    local: {
        userame: String, 
        email: String,
        password: String,
        resetpasswordToken: String,
        resetpasswordExpires: Date,

        urlToken: String,//generated random token for url
        urlCreatedAt: {
            type: Date,
            expires: 3600,//one hour in seconds
            default: Date.now // same as new Date()?
        }
    }

});

/*Or do it in mongo shell ====================================
First, create a TTL index: 
db.temp.clients.createIndex({'urlCreatedAt': 1}, {expireAfterSeconds: 3600})

Then:
db.temp.clients.insert({'urlCreatedAt': new Date()})
*/

// methods ======================
// generating a hash to encrypt password
tempUserSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);//use Salt encryption: genSaltSync(rounds), the number of rounds to process the data
};

module.exports = mongoose.model('TempClientModel', tempUserSchema,'temp.clients');//"temp.clients" is the collection name