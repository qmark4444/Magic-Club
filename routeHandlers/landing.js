const Trick = require('../models/Trick');
const Member = require('../models/Member');

exports.get_landing = function(req, res, next) {
  res.render('landing', { title: 'Magic Club', user: req.user });
}

// exports.show_members = function(req, res, next){
// 	return Member.find({}, (err, members) => {
// 		// res.json(members);
// 		res.render('member/members', { title: 'Magic Club', members: members, user: req.user });
// 	})
// };
//use async/await+try/catch to replace .then().catch()
exports.show_members = async function(req, res, next){
	try{
		const members = await Member.find(); //await a promise to resolve -> no need .then()
		res.render('member/members', { title: 'Magic Club', members: members, user: req.user });
	}
	catch(err){
		res.redirect('/');
	}
};

// exports.show_edit_member = async function(req, res, next) {
// 	try{
// 		const member = await Trick.findOne({ _id: req.paraams.id });
// 		res.render('member/edit_member', { member : member });
// 	}
// 	catch(err){
// 		res.redirect('/member');
// 	};
// }

exports.edit_member = async function(req, res, next) {
	// try{
	// 	const member = await Member.findOneAndUpdate(
	// 		{ _id: req.params.id },
	// 		{$set: {"local.active": true}}
	// 	);
	// 	if(!member) throw new Error();
	// 	res.json({message: "success in update member"});
	// }
	// catch(err){
	// 	res.json({message: "wrong in update member"})
	// };

	try{
		const member = await Member.findOne({
			_id: req.params.id 
		});
		if(!member) throw new Error();
		let newActive = !member.local.active;
		// const updatedMember = await member.set({"local.active": newActive}); // not work
		//set() is not a promise
		//member.set({});
		//await member.save( (error, doc) => {} )
		const updatedMember = await Member.findOneAndUpdate(
			{ _id: req.params.id },
			{ $set: {"local.active": newActive} },
			{new: true} // force return updated
		);
		if(!updatedMember) throw new Error();
		res.json(updatedMember);
	}
	catch(err){
		res.json({message: "wrong in update member"})
	};
}

exports.submit_trick = function(req, res, next) {
	return Trick.create({
		title: req.body.trick_title,
		description: req.body.trick_description
	})
	.then(trick => {
		res.redirect('/tricks');
	})
}

// exports.show_tricks = function(req, res, next) {
// 	return Trick.find({}).then(tricks => {
//  		res.render('trick/tricks', { title: 'Magic Club', tricks: tricks });		
// 	})
// }
exports.show_tricks = async function(req, res, next) {
	try{
		const tricks = await Trick.find();
		res.render('trick/tricks', { title: 'Magic Club', tricks: tricks, user: req.user });
	}
	catch(err){
		res.redirect('/');
	}
}

exports.show_trick = function(req, res, next) {
	return Trick.findOne({
		_id : req.params.id
	}).then(trick => {
		console.log('trick ', trick)
		res.render('trick/trick', { trick : trick, user: req.user });
	});
}

exports.show_edit_trick = function(req, res, next) {
	return Trick.findOne({
		_id : req.params.id
	}).then(trick => {
		res.render('trick/edit_trick', { trick : trick });
	});
}

exports.edit_trick = function(req, res, next) {

	return Trick.findOneAndUpdate(
		{
			_id : req.params.id
		},
		{
			title: req.body.trick_title,
			description: req.body.trick_description
		}
	).then(result => {
		res.redirect('/trick/' + req.params.id);
	})
}
exports.delete_trick = function(req, res, next) {
	return Trick.deleteOne({
		_id : req.params.id
	}).then(result => {
		res.redirect('/tricks');
	})
}

exports.delete_trick_json = function(req, res, next) {
	return Trick.deleteOne({
		_id : req.params.id
	}).then(result => {
		res.send({ msg: "Success" });
	})
}
