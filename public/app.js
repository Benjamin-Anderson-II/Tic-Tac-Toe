import startMultiPlayer from './multiPlayer.js'

const homeButtons = document.querySelectorAll('.return-home-button');

// board for single player matches
let board = [
	['','',''],
	['','',''],
	['','','']];

const player1 = 'X';
const player2 = 'O';
let currentPlayer = true; // true = player 1
let isGameOver = false;
let playerNum = 0; // 0 for single player. 1 & 2 for multiplayer
let ready  = false;
let enemyReady = false;
let roomId = '';

init();

function init(){
	// Set Up General Event Listeners
	for(var i = 0; i < homeButtons.length; i++){
		homeButtons[i].addEventListener('click', returnHome)
	}

	// Get Game Mode
	var url = window.location.href
	var slashSplit = url.split('/');
	if(slashSplit[slashSplit.length-2]==='multiplayer'){
		startMultiPlayer();
	}
	else if(slashSplit[slashSplit.length-1]==='solo') {
		startSoloPlay();
	}
}

function returnHome(){
	window.location.href="/";
}

function startSoloPlay(){
	gameMode = 'solo'
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			rows[i].children[j].textContent = board[i][j];
			rows[i].children[j].addEventListener('click', placeTileSolo);
		}
	}
	//add solo vs comp functionality
}

function reset(){
	for(var i = 0; i < 3; i++){
		for(var j = 0; j < 3; j++){
			board[i][j] = '';
			rows[i].children[j].textContent = board[i][j];
			rows[i].children[j].disabled = false;
		}
	}
	currentPlayer = !currentPlayer;
}

function forfeit(){
	console.log("You forfeit the match loser")
}

function updateBoard(id, player){
	switch(id){
//--------------TOP ROW--------------
	case 'top-left':
		board[0][0] = player;
		break;
	case 'top-center':
		board[0][1] = player;
		break;
	case 'top-right':
		board[0][2] = player;
		break;
//--------------MIDDLE ROW--------------
	case 'mid-left':
		board[1][0] = player;
		break;
	case 'mid-center':
		board[1][1] = player;
		break;
	case 'mid-right':
		board[1][2] = player;
		break;
//--------------BOTTOM ROW--------------
	case 'bot-left':
		board[2][0] = player;
		break;
	case 'bot-center':
		board[2][1] = player;
		break;
	case 'bot-right':
		board[2][2] = player;
		break;

	}
}

function placeTileSolo(event){
	var player = (currentPlayer) ? player1 : player2;
	updateBoard(event.target.id, player);
	event.target.textContent = player;
	event.target.disabled = true;
	checkWinner();
	currentPlayer = !currentPlayer;
}

function disableBoard(){
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			rows[i].children[j].disabled = true;
		}
	}
}

function checkWinner(){
	for(var i = 0; i < 3; i++){
		if ((board[i][0]===board[i][1] && board[i][0]===board[i][2] && board[i][0]) // row match
		||  (board[0][i]===board[1][i] && board[0][i]===board[2][i] && board[0][i]) // column match
		){
			console.log((currentPlayer) ? player1 : player2, 'Wins!');
			disableBoard();
			//dislpayWinner(board[i][0]);
			isGameOver = true;
			return;
		}
	}
	if((board[0][0]===board[1][1] && board[0][0]===board[2][2] && board[0][0]) || //diagonal 1
	   (board[0][2]===board[1][1] && board[2][0]===board[1][1] && board[1][1])){  //diagonal 2
		console.log((currentPlayer) ? player1 : player2, 'Wins!');
		disableBoard();
		//dislpayWinner(board[i][0]);
		isGameOver = true;
		return;
	}
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			if(!board[i][j]) return;
		}
	}
	console.log("Cat's Game")
	isGameOver = true;
}