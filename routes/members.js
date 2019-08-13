var express = require('express');
var router = express.Router();

let landing = require('../routeHandlers/landing');
let {isLoggedIn, hasAuth} = require('../middlewares/userAuth.js');

router.get('/', landing.show_members);

// router.get('/member/:id', hasAuth, landing.show_edit_member);

router.post('/member/:id', hasAuth, landing.edit_member);

module.exports = router;
