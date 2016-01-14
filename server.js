var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var db = require('./db.js');
var bcrypt = require('bcryptjs');


var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET /todos?completed=true&q=house
app.get('/todos', function(req, res) {
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


	/*
	var filteredTodos = todos;

	if (queryParams.completed && queryParams.completed === 'true') {
		console.log('a');
		filteredTodos = _.where(filteredTodos, {
			completed: true
		});
	} else if (queryParams.completed && queryParams.completed === 'false') {
		console.log('b');
		filteredTodos = _.where(filteredTodos, {
			completed: false
		});
	}

	if (queryParams.q && _.isString(queryParams.q) && queryParams.q.length > 0) {
		console.log('q is given and of correct form');

		filteredTodos = _.filter(filteredTodos, function(item) {
			if (item.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1) {
				return true;
			} else {
				return false;
			}
		});

	}
	res.json(filteredTodos); */
});

// GET /todos/:id
app.get('/todos/:id', function(req, res) {
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

	/*
	var matchedTodo = _.findWhere(todos, {
		id: todoId
	});

	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();
	}*/
	//res.send('asking for todo with id of ' + req.params.id)
});

// POST /todos
app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(instance) {
		res.json(instance.toJSON());
	}, function(e) {
		// return errof
		res.status(400).json(e);
	});
	/*

		if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
			return res.status(400).send();
		}
		body.description = body.description.trim();

		body.id = todoNextId;
		todoNextId++;
		todos.push(body);
		res.json(body);
		*/
});

// DELETE /todos:/id


app.delete('/todos/:id', function(req, res) {
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


	// my code V
	// db.todo.findById(todoId).then(function(todo) {
	// 	if (todo) {
	// 		console.log('trying to delete row...');

	// 		db.todo.destroy({
	// 			where: {
	// 				id: todoId
	// 			}
	// 		});

	// 		res.json(todo.toJSON());
	// 	} else {
	// 		console.log('todo with given id not found');
	// 		res.status(404).send();
	// 	}
	// }, function(e) {
	// 	res.status(500).send();
	// });

});

// PUT /todos/:id
app.put('/todos/:id', function(req, res) {
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