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
const fs = require('fs')
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
	socket.on('join-room', (roomId, callback) => joinRoom(socket, roomId, callback));

	// on create room reequest
	socket.on('make-room', (callback) => makeRoom(socket, callback));

	// Client Room Join Request
	socket.on('join-socket-room', (roomId, playerNum) => joinSocketRoom(socket, roomId, playerNum));

	// On ready
	socket.on('player-ready', (roomId, playerNum) => playerReady(socket, roomId, playerNum));

	// Initiate Game Logic
	socket.on('mark', (roomId, playerNum, cellId) => markCell(socket, roomId, playerNum, cellId));

	// Check Game Status
	socket.on('game-status', (isGameOver, roomId) => gameStatus(socket, isGameOver));

	//Handle player disconnect
	socket.on('disconnecting', () => disconnecting(socket));
})

function makeRoom(socket, callback){
	//reinitialize serverData
	serverData = editJsonFile('./serverData.json');

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
			"top-left": "",
			"top-center": "",
			"top-right": "",
			"mid-left": "",
			"mid-center": "",
			"mid-right": "",
			"bot-left": "",
			"bot-center": "",
			"bot-right": ""
		})
		serverData.save();
		callback({roomId: id, playerNum: 1});
	}
}

function joinRoom(socket, id, callback){
	var roomData = serverData.get("gameRooms").find(o => o.roomId===id);
	if(roomData && !(roomData.player1 && roomData.player2)) // room is avalable and not full
		if(roomData.player1){
			callback(2);
		}
		else {
			callback(1);
		}
	else {
		callback(false);
	}
}

function joinSocketRoom(socket, roomId, playerNum){
	console.log("== join socket room pNum:",playerNum)
	var roomData = serverData.get("gameRooms").find(o => o.roomId===roomId);

	// Join the Room
	socket.join(roomId.toString())
	
	// Put ID in serverData
	if(playerNum===1)
		roomData.player1 = socket.id;
	else if(playerNum===2)
		roomData.player2 = socket.id;
	serverData.save();
}

function playerReady(socket, roomId, playerNum){
	socket.to(roomId.toString()).emit('enemy-ready', playerNum);
	var roomData = serverData.get("gameRooms").find(o => o.roomId===roomId);
	if(playerNum===1) roomData.p1_ready = true;
	else if (playerNum===2) roomData.p2_ready = true;
	serverData.save();
}

function markCell(socket, roomId, playerNum, cellId){
	// Update sever with new info
	var gameData = serverData.get("gameRooms").find(o => o.roomId===roomId);
	gameData[cellId] = (parseInt(playerNum)===1) ? 'X' : 'O';
	serverData.save();

	// Inform client boards of change
	io.to(roomId.toString()).emit('mark', cellId, gameData[cellId]);

	// make game board from JSON data
	let board = [gameData['top-left'], gameData['top-center'], gameData['top-right'],
				 gameData['mid-left'], gameData['mid-center'], gameData['mid-right'],
				 gameData['bot-left'], gameData['bot-center'], gameData['bot-right']];

	// check if game over
	if((board[0] && (board[0] === board[1] && board[1] === board[2])) //top row
	|| (board[3] && (board[3] === board[4] && board[4] === board[5])) //middle row
	|| (board[6] && (board[6] === board[7] && board[7] === board[8])) //bottom row

	|| (board[0] && (board[0] === board[3] && board[3] === board[6])) //left column
	|| (board[1] && (board[1] === board[4] && board[4] === board[7])) //center column
	|| (board[2] && (board[2] === board[5] && board[5] === board[8])) //right column

	|| (board[0] && (board[0] === board[4] && board[4] === board[8])) //top left -> bottom right diagonal
	|| (board[2] && (board[2] === board[4] && board[4] === board[6])))//top-left -> bottom left diagonal
		//Tell clients who won
		io.to(roomId.toString()).emit('game-over', playerNum);
}

function gameStatus(socket, roomId, isGameOver){
	if(isGameOver) console.log('game is over');
	io.to(roomId.toString()).emit('game-status', isGameOver); //broadcast to all in room
}

function disconnecting(socket){
	var roomId = Array.from(socket.rooms)[1];
	//If player disconnecting from game room
	if(roomId){
		var roomData = serverData.get("gameRooms").find(o => o.roomId === roomId);
		if(roomData.player1 === socket.id){
			roomData.player1 = false;
			socket.to(roomId.toString()).emit('set-player-num', 1);
		} else if (roomData.player2 === socket.id){
			roomData.player2 = false;
			socket.to(roomId.toString()).emit('set-player-num', 2);
		}
		serverData.save();

		// Delete room if no one is in it.
		if(!roomData.player1 && !roomData.player2){
			// get room index
			var i;
			for(i = 0; i < serverData.get("gameRooms").length; i++)
				if((serverData.get("gameRooms")[i].roomId) === Array.from(socket.rooms)[1]) 
					break;

			fs.readFile('./serverData.json', 'utf8', (err, jsonString) => {
				var data = JSON.parse(jsonString);
				data['gameRooms'].splice(i, i);
				const toWrite = JSON.stringify(data, null, 2)
				fs.writeFile('./serverData.json', toWrite, err => {
					if(err) console.log("BROKE!!");
				});
			});
			serverData = editJsonFile('./serverData.json')
		}
	}
}

/**Things Left To Do
 * fix bugs
 *  - can still click other players tiles
 *  - can click multiple times
 * pretty up
 *  - FRONT PAGE:
 * 		- ENTER corresponds to JOIN button
 *  - add play again modal
*/