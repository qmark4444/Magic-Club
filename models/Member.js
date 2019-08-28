var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

const MemberSchema = mongoose.Schema({
    local: { 
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true 
        },
        password: {
            type: String,
            required: true
        },
        resetpasswordToken: String,
        resetpasswordExpires: Date,
        active: {
            type: Boolean, 
            default: true
        },
        isAdmin: {
            type: Boolean, 
            default: false
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    facebook: {
        id: String,
        token: String,
        email: String,
        name: String,
    },
    twitter: {
        id: String,
        token: String,
        displayName: String,
        username: String,
    },
    google: {
        id: String,
        token: String,
        email: String,
        name: String,
    },
}
// , {
//     timestamps: true
// }
);

// MemberSchema.methods.generateHash = function (password) {
MemberSchema.statics.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);//use Salt encryption: genSaltSync(rounds), the number of rounds to process the data
};

module.exports = mongoose.model('Member', MemberSchema);