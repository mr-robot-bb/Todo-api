module.exports = function (db) {

	return {
		requireAuthentication: function(req, res, next){
			var token = req.get('Auth');
			console.log('checking user');
			db.user.findByToken(token).then(function(user){
				req.user = user;
				next();
			}, function(){
				console.log('user not authenticated');
				res.status(401).send();
			});
		}
	};

};