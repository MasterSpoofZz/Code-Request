const express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var mongoose = require('mongoose');
var url = "mongodb://heroku_4tsr3x6g:35o34n15fj32pqjnoo2puqn3qh@ds117919.mlab.com:17919/heroku_4tsr3x6g";
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var bcrypt = require('bcrypt-nodejs');
var Ouch = require('ouch');
var bodyParser = require('body-parser');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

app.disable('view cache');

mongoose.connect(url);

var Server = mongoose.model('Server', {
	created_by: ObjectId,
	name: String,
	description: String,
	ip: String,
	version: String,
	type: Array,
	gameplay: Array,
	url: String,
	youtube_video: String
});

var User = mongoose.model('User', {
	username: {
		type: String,
		match: /^[a-z0-9_-]$/,
		min: 4,
		max: 32,
		unique: true
	},
	email: {
		type: String,
		match: /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/,
		unique: true
	},
	password: String,
	admin: Boolean,
	ip: Array
});

app.set('view engine', 'ejs');

app.use(cookieParser('3u82j898j023j9823g'));
app.use(session({ cookie: { maxAge: 60000}}));
app.use(flash());

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(express.static('public', {
    maxAge: '2h'
}));

app.get('/', function(req, res) {
    res.render('pages/index', { error: req.flash('error'), success: req.flash('success')});
});

app.get('/login', function(req, res) {
    res.render('pages/login', { error: req.flash('error'), success: req.flash('success')});
});

app.get('/signup', function(req, res) {
    res.render('pages/signup', { error: req.flash('error'), success: req.flash('success')});
});

app.post('/signup', function(req, res) {
	if (req.body.password !== req.body.confirmpassword) {
		req.flash('error', 'Your passwords did not match.');
		res.redirect('/signup');
		return;
	}

    var username2 = req.body.username;
	var password2 = req.body.password;
	var email2 = req.body.email;
	var hashedPassword = bcrypt.hashSync(password2);
	var isAdmin = false;

	User.find({}, function(err, users) {
		if (err) throw err;
		if (users.length === 0) {
			isAdmin = true;
		}
	});

	var user = new User({
		username: username2,
		password: hashedPassword,
		admin: isAdmin,
		email: email2
	});
	user.save(function(err) {
		if (err) {
			switch (err.name) {
				case "ValidationError":
					req.flash('error', 'That account already exists on this site. Please log in if you already have an account.');
					res.redirect('/signup');
					return;
					break;
				default:
					throw err;
					return;
					break;

			}
			return;
		}
		console.log('Created a user named ' + username2);
	});
	req.flash('info', 'Successfully created your account. You can now log in.');
	res.redirect('/');
	return;
});

app.get('/add-server', function(req, res) {
    res.render('pages/add-server', { error: req.flash('error'), success: req.flash('success')});
});

app.use(function (err, req, res, next) {
    (new Ouch()).pushHandler(
        new Ouch.handlers.PrettyPageHandler()
    ).handleException(err, req, res, function () {
        //console.log('Error handled');
    });
});

app.listen(port, function() {
    console.log("App listening on port " + port + "!");
});
