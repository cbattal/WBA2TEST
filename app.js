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
app.use(express.methodOverride());

if('developement' == app.get('env')) {
	app.use(express.errorHandler());
}

// POST auf ongs
app.post('/songs', function(req, res, next){
	
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

	// Nachricht an Topic '/songs' publishen
	var publication = pubClient.publish('/songs', req.body);

	//Nachricht an Topic 'Updates' (alle Benachrichtigungen) publishen
	//var publication = pubClient.publish('/updates', req.body);

	if(req.body.genre == "Rock"){
		var publication = pubClient.publish('/songs/rock', req.body);
	}
	if(req.body.genre == "Pop"){
		var publication = pubClient.publish('/songs/pop', req.body);
	}
	if(req.body.genre == "RnB"){
		var publication = pubClient.publish('/songs/rnb', req.body);
	}
	if(req.body.genre == "Hip Hop"){
		var publication = pubClient.publish('/songs/hiphop', req.body);
	}


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

// GET auf 'songs'
app.get('/songs', function(req, res, next){ 

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


app.post('/songs/:_id', function(req, res, next){

	if(req.body.rating == 1){
		//Song positiv bewertet
		songsCollection.update({_id: ObjectId('"'+req.body.id+'"')} , {$inc: {rating: 1}}).toArray(function(err, result){

			//Fehlerbehandlung
			if(err){
				next(err);
			}

			else{
				console.log(req.body.id + ' & ' + req.body.rating)
				res.writeHead(200, {
					'Conten-Type': 'application/json'
				});
				res.write(JSON.stringify(result));
				res.end();
				
			}
		});
	}
	else{
		//Song negativ bewertet
		songsCollection.update({_id: ObjectId('"'+req.body.id+'"')} , {$inc: {rating: -1}}).toArray(function(err, result){

			//Fehlerbehandlung
			if(err){
				next(err);
			}

			else{
				res.writeHead(200, {
					'Conten-Type': 'application/json'
				});
				res.write(JSON.stringify(result));
				res.end();
			}
		});	
	}
});

// GET auf 'rock'
app.get('/songs/rock', function(req, res, next){

	//Ruft alle Dokumente der Collection ab
	songsCollection.find({genre: "Rock"}).sort({titel: 1}).toArray(function(err, result){
		
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

// GET auf 'hip hop'
app.get('/songs/hiphop', function(req, res, next){

	//Ruft alle Dokumente der Collection ab
	songsCollection.find({genre: "Hip Hop"}).sort({titel: 1}).toArray(function(err, result){
		
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

// GET auf 'pop'
app.get('/songs/pop', function(req, res, next){

	//Ruft alle Dokumente der Collection ab
	songsCollection.find({genre: "Pop"}).sort({titel: 1}).toArray(function(err, result){
		
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

// GET auf 'rnb'
app.get('/songs/rnb', function(req, res, next){

	//Ruft alle Dokumente der Collection ab
	songsCollection.find({genre: "RnB"}).sort({titel: 1}).toArray(function(err, result){
		
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
/*
// GET auf 'updates'
app.get('/updates', function(req, res, next){

	//Ruft alle Dokumente der Collection ab
	songsCollection.find().sort({rating: -1}).toArray(function(err, result){
		
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
*/


// Keine Gute Ressource
//GET auf Suche
app.get('/suche', function(req, res, next){

	var suchenach = req.query.suchenach;

	//Ruft alle Dokumente der Collection ab
	songsCollection.find({suchenach :{ $regex: '"\b'+req.query.sucheingabe+'b\"', $options: 'i'}}, function(err, result){
		
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
app.use(function (error, request, response, next){
	console.error(error.stack);
	response.writeHead(500, 'Ein Fehler ist aufgetreten');
	response.end(error.message);
});

server.listen(3000, function(){
	console.log('Server listens on port 3000');
});