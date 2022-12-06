const singlePlayerButton = document.getElementById('single-player-button');
const joinLobbyButton = document.getElementById('join-lobby-button');
const createLobbyButton = document.getElementById('create-lobby-button');

var slashSplit = window.location.href.split('/');
if(slashSplit[slashSplit.length-1]==='home'){
	singlePlayerButton.addEventListener('click', () => window.location.href="/solo");
	joinLobbyButton.addEventListener('click', joinLobby)
	createLobbyButton.addEventListener('click', createLobby)
}

function joinLobby(event){
	//ask server if lobby exists
	//join lobby
	var roomId = document.getElementById('room-id-num').value;
	var socket = io();
	socket.emit('join-room', roomId, (response) => {
		if(response) {
			localStorage.setItem('playerNum', response);
			window.location.href="/multiplayer/"+roomId;
		}
		else
			console.log("That room is unavailable");
	});
}

function createLobby(event){
	//create the lobby
	var socket = io();
	socket.emit('make-room', (response) => {
		if(response){
			localStorage.setItem('playerNum', response.playerNum);
			window.location.href = '/multiplayer/'+response.roomId;
		} else
			console.log('server is full');
	});
}