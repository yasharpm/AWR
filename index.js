const express = require('express');
const path = require('path');
const url = require('url');

const app = express();

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/index.html'))
})

app.get('/analytics', function(req, res) {
	const status = { registration_count: 1024, prefession_count: 32 };
	res.json(status);
})

app.get('/register', function(req, res) {
	res.sendFile(path.join(__dirname + '/register.html'))
})

app.get('/browse', function(req, res) {
	res.sendFile(path.join(__dirname + '/browse.html'))
})

app.get('/tags', function(req, res) {
	const query = url.parse(req.url, true).query.q.trim();
	
	const matches = [ 'Android developer', 'Software engineer', 'Social marketing expert' ];
	
	res.send(matches);
})

app.post('/register', function(req, res) {
	res.json({status: 'ok'})
	//res.status(400).json({message: 'Some fileds are not filled.'})
})

app.get('/search', function(req, res) {
	const query = url.parse(req.url, true).query.q.trim();
	
	const result = [ {name: 'Yashar PourMohamad', url: 'https://ecosia.org', tags: ['Android developer', 'Software engineer'], info: 'I can do anything in the software development lifecycle. Experienced in team management and team making.'},{name: 'Yashar PourMohamad', url: 'https://ecosia.org', tags: ['Android developer', 'Software engineer'], info: 'I can do anything in the software development lifecycle. Experienced in team management and team making.'},{name: 'Yashar PourMohamad', url: 'https://ecosia.org', tags: ['Android developer', 'Software engineer'], info: 'I can do anything in the software development lifecycle. Experienced in team management and team making.'} ];
	
	res.send(result);
})

app.listen(80, function () {
	console.log('Listening on port 80!')
})
