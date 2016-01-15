var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var db = require('./db.js');
var bcrypt = require('bcryptjs');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET /todos?completed=true&q=house
app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var query = req.query;
	var where = {};

	if (query.hasOwnProperty('completed')) {
		if (query.completed === 'true') {
			where.completed = true;
		} else if (query.completed === 'false') {
			where.completed = false;
		}
	}

	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.todo.findAll({
		where: where
	}).then(function(todos) {
		//console.log('todos: ' + todos.toJSON());
		res.json(todos);
	}, function(e) {
		res.status(500).send();
	});


	
});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findById(todoId).then(function(todo) {
		if (todo) {
			console.log(todo.toJSON());
			res.json(todo.toJSON());
		} else {
			console.log('todo not found');
			res.status(404).send();
		}
	}, function(e) {
		res.status(500).send();
	});

	
});

// POST /todos
app.post('/todos', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		console.log('created todo');
		req.user.addTodo(todo).then(function(){
			console.log('added todo');
			return todo.reload();
		}).then(function(todo){
			console.log('reloaded todo');
			res.json(todo.toJSON());
		});
	}, function(e) {
		// return errof
		res.status(400).json(e);
	});
	
});

// DELETE /todos:/id


app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoId
		}
	}).then(function(rowsDeleted) {
		if (rowsDeleted === 0) {
			res.status(404).json({
				error: 'no todo with id'
			});
		} else {
			res.status(204).send();
		}
	}, function(e) {
		res.status(500).send();
	});




});

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};


	// check the completed bool
	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	}

	// check the description strin
	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	db.todo.findById(todoId).then(function(todo) {
		if (todo) {
			todo.update(attributes).then(function(todo) {
				res.json(todo.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	}, function() {
		res.status(500).send();
	});
});

app.post('/users', function(req, res){
	var body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then(function(instance) {
		res.json(instance.toPublicJSON());
	}, function(e) {
		// return errof
		res.status(400).json(e);
	});
});

// POST /users/login
app.post('/users/login', function(req, res){
	var body = _.pick(req.body, 'email', 'password');
	db.user.authenticate(body).then(function(user){
		console.log('User found');
		var token = user.generateToken('authentication')
		if(token){
			res.header('Auth', token).json(user.toPublicJSON());
		}else{
			res.status(401).send(); // no token...
		}
		
	}, function() {
		console.log('Something wrong');
		res.status(401).send();
	});



});

db.sequelize.sync({force: true}).then(function() {
	app.listen(PORT, function() {
		console.log('Express listening to port ' + PORT + '!');
	});
});