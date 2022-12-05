const express = require("express")
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const expressHandlebars = require('express-handlebars')
const editJsonFile = require('edit-json-file')
let serverData = editJsonFile('./serverData.json')

//register handlebars engine with express
app.engine('handlebars', expressHandlebars.engine({
	defaultLayout: "main"
}));
app.set('view engine', 'handlebars');

//set static folder
app.use(express.static('public/'));

//start server
server.listen(PORT, () => console.log('== Server running on port', PORT));

//Front Page
app.get('/', (req, res, next) => {
	res.redirect('/home')
});
app.get('/home', (req, res, next) => {
	res.status(200).render('frontPage');
})

//Solo Play Page
app.get('/solo', (req, res, next) => {
	res.status(200).render('gamePage', {multiplayer: false, p1: "User", p2: "Computer"});
});

//Multiplayer Page
app.get('/multiplayer/:n', (req, res, next) => {
	var n = req.params.n;
	if(parseInt(n)!==-1){ // make sure it isn't trying to load the filler room
		var gameData = serverData.get("gameRooms").find(o => o.roomId===n);
		if(gameData){
			console.log("== A player has joined game lobby", n + '.');

			//check which player is joining
			if(gameData.player1) gameData.player2 = true;
			else gameData.player1 = true;
			serverData.save();
			res.status(200).render('gamePage', {multiplayer: true, p1: "Player 1", p2: "Player 2", board: [gameData]});
		} else next();
	} else next();
});

//404 Page
app.get('*', (req, res, next) =>{
	res.status(404).render('404');
});

//Handle a socket connection request from web client
io.on('connection', socket => {
	console.log('New WS connection')

	// on join room request
	socket.on('get-room', (roomId, callback) => getRoom(socket, roomId, callback));

	// on create room reequest
	socket.on('make-room', (callback) => makeRoom(socket, callback));

	//Handle player disconnect
	socket.on('disconnect', (roomId, playerNum) => disconnect(socket, roomId, playerNum));

	// On ready
	socket.on('player-ready', (roomId, playerNum) => playerReady(socket, roomId, playerNum))

	// Check Player Connections
	socket.on('check-players', (roomId) => checkPlayers(socket, roomId));

	socket.on('test', (str) => console.log(str));

	socket.on('mark', (roomId, playerNum, cellId) => markCell(socket, roomId, playerNum, cellId))

	socket.on('game-status', isGameOver => gameStatus(socket, isGameOver))
})

function makeRoom(socket, callback){
	//check to see if server is full
	if(serverData.get("gameRooms").length===10000) callback(false);
	else {
		//get the lowest roomId
		var id = serverData.get("gameRooms").reduce((prev, curr) => {
			return (prev.roomId < curr.roomId) ? prev.roomId : curr.roomId;
		});
		// increment id by 1 and format
		id = (parseInt(id) + 1).toString().padStart(4, '0');

		//make room
		serverData.append('gameRooms', {
			"roomId": id,
			"player1": false,
			"p1_ready": false,
			"player2": false,
			"p2_ready": false,
			"topLeft": "",
			"topCenter": "",
			"topRight": "",
			"midLeft": "",
			"midCenter": "",
			"midRight": "",
			"botLeft": "",
			"botCenter": "",
			"botRight": ""
		})
		serverData.save();
		callback({roomId: id, playerNum: 1});
	}
}

function getRoom(socket, id, callback) {
	var roomData = serverData.get("gameRooms").find(o => o.roomId===id);
	if(roomData && !(roomData.player1 && roomData.player2)) // room is avalable and not full
		if(roomData.player1) callback(2);
		else callback(1);
	else {
		callback(false);
	}
}

function checkPlayers(socket, roomId){
	let players = [];
	var roomData = serverData.get("gameRooms").find(o => o.roomId===roomId);
	players.push({connected: roomData.player1, ready: roomData.p1_ready});
	players.push({connected: roomData.player2, ready: roomData.p2_ready});
	socket.emit('check-players', players);
}

function playerReady(socket, roomId, playerNum){
	socket.emit('enemy-ready', playerNum);
	var roomData = serverData.get("gameRooms").find(o => o.roomId===roomId);
	if(playerNum===1) roomData.p1_ready = true;
	else if (playerNum===2) roomData.p2_ready = true;
	serverData.save();
}

function markCell(socket, roomId, playerNum, cellId){
	console.log('== Lobby:', roomId);
	console.log('  -- Player:', playerNum);
	console.log('    -- Cell:', cellId);
	var gameData = serverData.get("gameRooms").find(o => o.roomId===roomId);
	gameData[cellId] = (parseInt(playerNum)===1) ? 'X' : 'O';
	serverData.save();
	socket.broadcast.emit('mark', cellId);
}

function gameStatus(socket, isGameOver){
	if(isGameOver) console.log('game is over');
	socket.broadcast.emit('game-status', isGameOver)
}
 
function disconnect(socket, roomId, playerNum) {
	console.log('Player', playerNum, 'from', roomId, 'disconnected!');
	var roomData = serverData.get("gameRooms").find(o => o.roomId===roomId);
	console.log(roomData)
	if(roomData!==undefined){
		if(playerNum===1)
			roomData.player1 = false;
		else //playerNum===2
			roomData.player2 = false;
		serverData.save();
	}
}