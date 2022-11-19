const express = require("express")
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio =require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

//set static folder
app.use(express.static(path.join(__dirname, "public")))

//start server
server.listen(PORT, () => console.log('Server running on port', PORT))

//Handle a socket connection request from web client

const connections = [null, null]
io.on('connection', socket => {
	//console.log('New WS connection')

	//find an available player number
	let playerIndex = -1;
	for (const i in connections){
		if(connections[i]===null){
			playerIndex = i;
			break;
		}
	}

	// Tell the connecting client what player number they are
	socket.emit('player-number', playerIndex);

	console.log("Player", playerIndex, "has connected");

	//ignore player 3
	if(playerIndex===-1)return;

	connections[playerIndex] = false;

	//Tell everyone what player number just connected
	socket.broadcast.emit('player-connection', playerIndex)

	// Handle Disconnect
	socket.on('disconnect', () => {
		console.log('Player', playerIndex, "disconnected");
		connections[playerIndex] = null;
		//Tell everyone what player num just DC'd
		socket.broadcast.emit('player-connection', playerIndex)
	})

	// On ready
	socket.on('player-ready', () => {
		socket.broadcast.emit('enemy-ready', playerIndex)
		connections[playerIndex] = true;
	})

	// Check Player Connections
	socket.on('check-players', () => {
		const players = [];
		for (const i in connections){
			connections[i] == null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
		}
		socket.emit('check-players', players)
	})

	// On Symbol Marked
	socket.on('mark', id => {
		console.log('Place Symbol in', id, 'from', playerIndex);

		// Emit the move to the other player
		socket.broadcast.emit('mark', id)
	})

	// Is gameover
	socket.on('game-status', isGameOver => {
		console.log('game is over')
		socket.broadcast.emit('game-status', isGameOver);
	})
})