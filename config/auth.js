// config/auth.js
//export our config

module.exports = {
	'facebookAuth': {
        // 'clientID'      : '519563724887430',  //App ID
        // 'clientSecret'  : 'de868336ab8ce45c0255b55b4d6002e5', //App Secret        
        // 'clientID'      : '513927235451079',  //App ID
        // 'clientSecret'  : '6b331aa1df29ac2f68d0c25c80ed1f4c', //App Secret
        'clientID'	    : '1177535975597488',  //App ID
        
        'clientSecret'  : '9b7399fe7a0ef08f915ca4265e2bff79', //App Secret

		'callbackURL'	: 'http://52.91.32.176:3000/auth/facebook/callback'
	},

    'twitterAuth' : { 

        'consumerKey'       : 'Vu18CJfcDHU0Nf6K8YwZm8r7i',
                               // 4kkGotqQXW5ih2PO0800SJNSD
        'consumerSecret'    : 'vOChPhqXLCuj0QhButd8oeKZnfj6YrdBndmwPuUUaEBtBUD7kP',
                               // URKA79baiCoXpY76tLiPxDECDZpFRARwWOz48RWH228kxAHt6l
        'callbackURL'       : //'http://52.91.32.176:3000/auth/twitter/callback' //TrendifyLive.com server ip address
                                //34.204.25.234:3000
                                'https://ottawa.trendifylive.com/auth/twitter/callback'

    },

    'googleAuth' : {
        'clientID'      : 'your-secret-clientID-here',
        'clientSecret'  : 'your-client-secret-here',
        'callbackURL'   : 'http://localhost:8080/auth/google/callback'
    }
};

