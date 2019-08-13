// define client data model

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var termSchema = new mongoose.Schema({
    name: String,
    activated: {type: Boolean, default: false},
});

var eventSchema = new mongoose.Schema({
    //eventId: Number,
    name: String,
    activated: {type: Boolean, default: false},
    terms: [termSchema],
    periods: [{startTime: Date, endTime: Date}]
});

var clientSchema = new mongoose.Schema({

    local: {
        username: String, 
        email: String,
        password: String,
        resetpasswordToken: String,
        resetpasswordExpires: Date,
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
    guest: {
        username: String, 
        count: Number 
    },
    tracking: {
        count: Number,
        trackId: String
    },
    timeLimit: {type: Number, default: 604800000}, //7*24*60*60*1000 seven days in ms
    dailyOperation: [String],
    events: [eventSchema],
    operation: {
        daily: {
            activated: {type: Boolean, default: true}//dailyOperation is activated by default
        },
        events: {
            activated: {type: Boolean, default: false}
        }
    },
    isDisabled: {type: Boolean, default: false},
    dailyTermLimit: {type: Number, default: 10},
    eventTermLimit: {type: Number, default: 6},

});

// methods ======================
// generating a hash to encrypt password 
clientSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);//use Salt encryption
};

// checking if password is valid
clientSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
};

clientSchema.methods.incrementCount = function () {
    if(!this.guest.count)
        this.guest.count = 1;
    else
        this.guest.count++;
    return;
};//actually realized this function in passport-strategies.js

clientSchema.statics.getTracking = function () {//static method can apply directly on model, no need an instance (methods need one)
    return this.tracking.count;//TypeError: Cannot read property 'count' of undefined: tracking = undefined
};

clientSchema.statics.increTracking = function() {

    this.tracking.count++;//TypeError: Cannot read property 'count' of undefined
};

clientSchema.statics.setTrackID = function (trackingCount) {

    //if(!trackingCount) // let other program to handle this consition: here assume all conditions are met!
    //    trackingCount = 1;

    var digits = trackingCount.toString().length;
    if(digits > 4){
        console.log('Warning: client tracking id is more than 4 digits');
        return;
    }
    //padding Zeros on the left side
    var trackId = "";
    for(var i = 0; i < 4 - digits; i++){
        trackId += 0; 
    }
    return trackId + trackingCount;
};

/*
class ClientTrack { // a class defined here has basically the same effect as above methods
    static getTrackCount() {
        return '${this.tracking.count}';
    }

    static increTrackCount() {       
        if(!this.tracking.count)
            this.tracking.count = 1;
        else
            this.tracking.count++;
    }

    static setTrackId(tc) {
        var digits = tc.toString().length;
        if(digits > 4){
            console.log('Warning: client tracking id is more than 4 digits');
            return;
        }
        //padding Zeros on the left side
        var trackId = "";
        for(var i = 0; i < 4 - digits; i++){
            trackId += 0; 
        }
        return trackId + tc;
    }
}

clientSchema.loadClass(ClientTrack);//define and load a class didn't solve the method is Undefined problem
//*/ 

/** create the model for client. Client data will be saved to a collection specified by Mongoose
* Mongoose specifies the collection name under the schema, the collection name is the third argument when declaring the model. 
* Otherwise it will use the pluralized version given by the name you map to the model - in this case the default name will be 'users'

* Another way to define the collection name is to add it in Schema: mongoose.Schema({...}, {collection: 'clients'});
*/

module.exports = mongoose.createConnection('mongodb://localhost:27017/clientDB').model('ClientModel', clientSchema,'clients');