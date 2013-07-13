// Express modules requirements
var express = require('express')
  , http = require('http')
  , path = require('path')
  , engines = require('consolidate');

// A wrapper to get a pretty console.log
// var tools = require('./tools.js');

// One of the most usefull Js library
var _ = require('underscore');

// Socket.IO module
var io = require('socket.io');


// Some tweakering to get ot to work with Express 3 
var app = express();
var server = http.createServer(app);
var io = io.listen(server);
io.set('log level', 1); 

/*
     Express configuation and route(s)
*/

// Basic Express configuration
app.configure(function(){
  app.set('port', process.env.WWW_PORT || 2000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Main route to deliver the static html
app.get('/',function(req, res){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  // res.header('Content-Type', 'text/html');
  res.render('index');
});


// Let's start the server
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var arr = [];
var channel = 0;
var s = [];

io.sockets.on('connection', function (socket) {
	socket.on('reqNew', function(data) {
		arr[channel] = socket;
		socket.emit('resNew', channel);
		channel++;
	});

	socket.on('reqJoin', function(data) {
		if(arr[data]) {
			s[socket.id] = arr[data]; // socket 2 -> socket 1
			s[arr[data].id] = socket; // socket 1 -> socket 2

			arr[data].emit('resJoin');

			console.log(s);
		} else {
			console.log("ERR");
			console.log(s, arr, data);
		}
	});

	socket.on('reqOffer', function(data) {
		s[socket.id].emit('resOffer', data);
	});

	socket.on('reqAnswer', function(data) {
		s[socket.id].emit('resAnswer', data);

	});

	socket.on('reqIce', function(data) {
		console.log(data);
		s[socket.id].emit('resIce', data);
	});

});
