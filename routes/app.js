var express = require('express');
var router = express.Router();

let landing = require('../routeHandlers/landing');
let user = require('../routeHandlers/user');

let {isLoggedIn, hasAuth} = require('../middlewares/userAuth.js');

router.get('/', landing.get_landing);
router.post('/', isLoggedIn, landing.submit_trick);

router.get('/tricks', isLoggedIn, landing.show_tricks);
router.get('/trick/:id', isLoggedIn, landing.show_trick);

router.get('/trick/:id/edit', hasAuth, landing.show_edit_trick);
router.post('/trick/:id/edit', hasAuth, landing.edit_trick);

router.post('/trick/:id/delete', hasAuth, landing.delete_trick);
router.post('/trick/:id/delete-json', hasAuth, landing.delete_trick_json);

router.get('/login', user.show_login);
router.post('/login', user.login);

router.get('/signup', user.show_signup);
router.post('/signup', user.signup);

router.get('/logout', user.logout);
// router.post('/logout', user.logout);

module.exports = router;