var mongoose = require('mongoose');

const MemberSchema = mongoose.Schema({
    local: { //passport-local
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

module.exports = mongoose.model('Member', MemberSchema);