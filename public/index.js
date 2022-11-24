const singlePlayerButton = document.getElementById('single-player-button');
const joinLobbyButton = document.getElementById('join-lobby-button');
const createLobbyButton = document.getElementById('create-lobby-id');

var slashSplit = window.location.href.split('/');
if(slashSplit[slashSplit.length-1]==='home'){
	singlePlayerButton.addEventListener('click', () => window.location.href="/solo");
	joinLobbyButton.addEventListener('click', joinLobby)
}

function joinLobby(event){
	//ask server if lobby exists
	//if lobby doesn't exist create one (tell server)
	//join lobby
}