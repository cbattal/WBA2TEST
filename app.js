//Requires
var express = require('express');
var http = require('http');
var faye = require('faye');
var mongodb = require('mongoskin');

// Express und http-Server erstellen
var app = express();
var server = http.createServer(app);

// Verbindung zur Datenbank herstellen
var db = mongodb.db('mongodb://localhost:27017/songsdb?auto_reconnect=true', {save: true});

// Collection "songs" binden
db.bind('songs');

app.use(express.static(__dirname + '/public'));

var songsCollection = db.songs;

// Nodeadapter konfigurieren
var bayeux = new faye.NodeAdapter({
	mount: '/faye',
	timeout: 45
});

// Nodeadapter zu http-Server hinzufügen
bayeux.attach(server);

// PubSub-Client erzeugen
var pubClient = bayeux.getClient();

app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());

if('developement' == app.get('env')) {
	app.use(express.errorHandler());
}

// POST auf allsongs
app.post('/allsongs', function(req, res, next){
	
	// Dokumente in Collektion "songs" speichern
	songsCollection.insert(req.body, function(err, result){
		if(err){
			next(err);
		}
		else{
			console.log(req.body.titel + ' wurde der Datenbank hinzugefuegt')
			res.write('Daten wurden gespeichert');
		}
	});

	// Nachricht an Topic 'allsongs' publishen
	var publication = pubClient.publish('/allsongs', req.body);

	// Promise-Handler wenn publishen erfolgreich
	publication.then(function(){
		res.writeHead(200, 'OK');
		res.write('Nachricht gesendet');
		res.end();
	},
	// Promise-Handler wenn Publishen fehlgeschlagen
	function(error){
		next(error);
	});
});

// GET auf 'allsongs'
app.get('/allsongs', function(req, res, next){

	//Ruft alle Dokumente der Collection ab
	songsCollection.find().sort({titel: 1}).toArray(function(err, result){
		
		// Fehlerbehandlung
		if(err){
			next(err);
		}

		// JSON-File an Client übertragen
		else{
			res.writeHead(200, {
				'Content-Type': 'application/json'
			});
			res.write(JSON.stringify(result));
			res.end();
		}
	});
});


// Errorhandler
app.use(function (error, request, reponse, next){
	console.error(error.stack);
	response.writeHead(500, 'Ein Fehler ist aufgetreten');
	response.end(error.message);
});

server.listen(3000, function(){
	console.log('Server listens on port 3000');
});