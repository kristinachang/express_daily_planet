var express = require('express');
var bodyParser = require('body-parser');
var pg = require("pg");
var ejs = require('ejs');
var methodOverride = require('method-override');
// Refactor connection and query code
var db = require("./models");
var session = require("express-session");
var app = express();

app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
	secret: 'super secret',
	resave: false,
	saveUninitialized: true
}));

app.use("/", function (req, res, next) {

  req.login = function (user) {
    req.session.userId = user.id;
  };

  req.currentUser = function () {
    return db.User.
      find({
        where: {
          id: req.session.userId
       }
      }).
      then(function (user) {
        req.user = user;
        return user;
      })
  };

  req.logout = function () {
    req.session.userId = null;
    req.user = null;
  }

  next(); 
});

app.get("/signup", function(req, res) {
	res.render("users/signup");
});

app.post("/users", function(req, res) {
	var user = req.body.user;
	db.User
	  .createSecure(user.email, user.password)
	  .then(function(user) {
	  	req.login(user);
	  	res.redirect("/profile");
	  });
});

app.get("/login", function(req, res) {
	res.render("users/login");
});

app.post("/login", function(req, res) {
	var user = req.body.user;
	db.User
	  .authenticate(user.email, user.password)
	  .then(function(user) {
	  	req.login(user);
	  	res.redirect("/profile");
	  });
});

app.get("/profile", function(req, res) {
	req.currentUser()
	   .then(function(user) {
	   	 res.render("users/profile", {user: user});
	   });
});


app.get('/articles', function(req, res) {
	db.Article.findAll(
		{include: [db.Author]})
		.then(function(articles) {
			res.render("articles/index", {articlesList: articles});
	});
});

app.get('/articles/new', function(req, res) {
	db.Author.all().then(function(authors) {
  		res.render('articles/new', {ejsAuthors: authors});
  	});
});

app.post('/articles', function(req, res) {
	db.Article.create(req.body.article)
			  .then(function(articles) {
			  	res.redirect('/articles');
			  });
});

app.get('/articles/:id', function(req, res) {
	db.Article.find( {where: {id: req.params.id}, include: [db.Author]})
			  .then(function(articles) {
			  	res.render('articles/article', {articleToDisplay: articles});
	});
});

// app.put('articles/:id', function(req, res) {
// 	res.redirect();
// })

// Fill in these author routes!
app.get('/authors', function(req, res) {
	db.Author.findAll()
			 .then(function(authors) {
			 	res.render('authors/index', {ejsAuthors: authors});
	});
});

app.get('/authors/new', function(req, res) {
	res.render('authors/new');
});

app.post('/authors', function(req, res) {
	db.Author.create(req.body.author)
			  .then(function(authors) {
			  	res.redirect('/authors');
	});
});

app.get('/authors/:id', function(req, res) {
	db.Author.find({ where: {id: req.params.id}, include: [db.Article]})
			 .then(function(authors) {
			 	res.render('authors/author', {ejsAuthor: authors});
	});
});

app.get('/', function(req, res) {
  res.render('site/index');
});

app.get('/about', function(req, res) {
  res.render('site/about');
});

app.get('/contact', function(req, res) {
  res.render('site/contact');
});

db.sequelize.sync().then(function() {
	app.listen(3000, function() {
	var msg = "* Listening on Port 3000 *";

	// Just for fun... what's going on in this code?
	/*
	 * When the server starts listening, it displays:
	 *
	 * 	**************************
	 *	* Listening on Port 3000 *
	 *	**************************
	 *
	*/
	console.log(Array(msg.length + 1).join("*"));
	console.log(msg);
	console.log(Array(msg.length + 1).join("*"));
	}); 
});

