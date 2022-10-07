const express = require('express');
const path = require('path');
const url = require('url');
const { MongoClient } = require('mongodb');

const dbClient = new MongoClient('mongodb://localhost:27017');

const DATABASE_NAME = 'awr';
const COLLECTION_USER = 'user';
const COLLECTION_TAG = 'tag';

var userCollection;
var tagCollection;

console.log('Connecting to database');
dbClient.connect(async (error, result) => {
	const db = dbClient.db(DATABASE_NAME);
	userCollection = db.collection(COLLECTION_USER);
	tagCollection = db.collection(COLLECTION_TAG);
	
	await tagCollection.createIndex({'name': 'text'});
	
	//await tagCollection.insertOne(tag);
	
	console.log('Successfullly connected to database');
});


const app = express();

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/index.html'))
})

app.get('/analytics', async function(req, res) {
	const registrationCount = await userCollection.count();
	const professionCount = await tagCollection.count();
	const status = { registration_count: registrationCount, prefession_count: professionCount };
	res.json(status);
})

app.get('/register', function(req, res) {
	res.sendFile(path.join(__dirname + '/register.html'))
})

app.get('/browse', function(req, res) {
	res.sendFile(path.join(__dirname + '/browse.html'))
})

app.get('/tags', async function(req, res) {
	const query = url.parse(req.url, true).query.q.trim();
	console.log('received tag query: ' + query);
	
	const cursor = tagCollection.find({name: { $regex: '^' + query + '', $options: 'i' }}, { sort: [['count', -1]], limit: 11, projection: {name:1} });
	
	const matches = [];
	
	await cursor.forEach(tag => matches.push(tag.name));
	console.log(matches);
	
	res.send(matches);
})

app.post('/register', async function(req, res) {
	console.log(req.body);
	
	const user = req.body;
	
	user.name = user.name.trim();
	
	if (user.name.length == 0) {
		res.status(400).json({message: 'Name is empty.'})
		return;
	}
	
	user.info = user.info.trim();
	
	if (user.info.length == 0) {
		res.status(400).json({message: 'Introduction is empty.'})
		return;
	}
	
	if (user.tags.length == 0) {
		res.status(400).json({message: 'At least one tag must be chosen.'})
		return;
	}
	
	user.url = user.url.trim();
	
	if (user.url.length == 0) {
		res.status(400).json({message: 'Contact link is empty.'})
		return;
	}
	
	if (user.salt.length == 0 || user.password.length == 0) {
		res.status(400).json({message: 'Invalid request.'})
		return;
	}
	
	var existingUser = await userCollection.findOne({url: {$eq: user.url}});
	
	if (existingUser != null) {
		res.status(400).json({message: 'Registration with this contact address alreadt exists!'})
		return;
	}
	
	await user.tags.forEach(async (tagName, index) => {
		tagName = tagName.trim();
		user.tags[index] = tagName;
		
		var result = await tagCollection.findOneAndUpdate({name: {$eq: tagName}}, {$inc:{count: 1}});
		
		if (result.value == null) {
			tagCollection.insertOne({name: tagName, count: 1});
		}
	});
	
	user['lookup'] = user.name + ' ' + user.info + ' ' + user.tags.join(' ');
	
	userCollection.insertOne(user);
	
	res.json({status: 'ok'});
})

app.get('/search', async function(req, res) {
	const query = url.parse(req.url, true).query.q.trim();
	
	console.log('received registry query: ' + query);
	
	const cursor = userCollection.find({lookup: { $regex: '' + query + '', $options: 'i' }}, { sort: [['_id', -1]], limit: 11, projection: {name:1, info:1, tags:1, url:1} });
	
	const result = await cursor.toArray();
	
	res.send(result);
})

app.listen(42488, function () {
	console.log('Listening on port 42488!')
})
