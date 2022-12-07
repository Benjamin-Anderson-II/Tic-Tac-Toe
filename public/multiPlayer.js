const rows = document.querySelectorAll('.row');
const readyButton = document.querySelector("#ready-button");
const forfeitButton = document.querySelector("#forfeit-button");
const infoDisplay = document.querySelector('#info-display');
const turnDislay = document.querySelector("#turn-display");
const playAgainButton = document.querySelector('#play-again-button');

let currentPlayer = true; // true = player 1
let playerNum = 0; // 0 for single player. 1 & 2 for multiplayer
let ready  = false;
let enemyReady = false;
let roomId = '';


function startMultiPlayer(){
	// Get roomId from URL
	roomId = window.location.href.split('/')[window.location.href.split('/').length-1];

	// Instantiate Socket
	const socket = io();

	// Get Your Player Num
	socket.emit('get-player-num', roomId, (pNum) => getPlayerNum(socket, pNum));

	// update the status lights
	socket.on('status-change', (status) => updateStatus(status))

	// On enemy ready
	socket.on('enemy-ready', () => onEnemyReady());

	// Ready button click
	readyButton.addEventListener('click', () => readyButtonListener(socket));

	//play again button clicked
	playAgainButton.addEventListener('click', () => playAgain(socket));

	// forfeit button clicked
	forfeitButton.addEventListener('click', () => forfeit(socket));

	// setup tile listeners
	setupTileListeners(socket);

	// on mark recieved
	socket.on('mark', (id, val, boardData) => markCell(id, val, boardData))

	// on game over
	socket.on('game-over', (winner) => gameOver(socket, winner));

	// on board clear
	socket.on('clear-board', (boardData) => clearBoard(socket, boardData));

	// update score
	socket.on('update-score', (score) => updateScore(score))
}

function vsPlay(){
	if(ready && enemyReady) {
		if(currentPlayer===true){
			turnDislay.textContent = "Your Go"
		}
		if(currentPlayer===false){
			turnDislay.textContent = "Enemy's Go"
		}
	}
}

function playerReady(){
	if((ready && playerNum===1) || (enemyReady&&playerNum===2))
		document.querySelector('#p1 .player .ready span').classList.add('green')
	if((ready && playerNum===2) || (enemyReady&&playerNum===1))
		document.querySelector('#p2 .player .ready span').classList.add('green')
	if((!ready && playerNum===1) || (!enemyReady&&playerNum===2))
		document.querySelector('#p1 .player .ready span').classList.remove('green')
	if((!ready && playerNum===2) || (!enemyReady&&playerNum===1))
		document.querySelector('#p2 .player .ready span').classList.remove('green')
}

function getPlayerNum(socket, pNum){
	playerNum = parseInt(pNum);

	playerConnectedOrDisconnected(playerNum)

	// Join SocketIO Room
	socket.emit('join-socket-room', roomId, playerNum)
	disableBoard();

	// Get Ready Statuses
	socket.emit('get-ready-status', roomId, (player_ready) => getReadyStatus(player_ready));
}

function getReadyStatus(player_ready){
	if(playerNum === 1) {
		ready = player_ready.p1_ready;
		enemyReady = player_ready.p2_ready;
	} else if(playerNum === 2) {
		ready = player_ready.p2_ready;
		enemyReady = player_ready.p1_ready;
	}
	playerReady();
}

function onEnemyReady() {
	enemyReady = true;
	playerReady(); //update ready lights
	vsPlay(); // attempt to start game
}

function readyButtonListener(socket){
	if(!ready){
		ready = true;
		playerReady();
		socket.emit('player-ready', roomId, playerNum, (cb) => {
			getCurrentPlayer(cb);
			if(currentPlayer) enableBoard(cb);
		});
		vsPlay();
	}
}

function playAgain(socket){
	// Hide the Modal
	document.getElementById('modal-backdrop').classList.toggle('hidden');
	document.getElementById('play-again-modal').classList.toggle('hidden');

	// Clear the Board
	socket.emit('clear-board', roomId); // also "un-ready"s all players
}

function forfeit(socket) {
	socket.emit('clear-board', roomId);
	socket.emit('forfeit', roomId, playerNum);
}

function clearBoard(socket, boardData) {
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			rows[i].children[j].textContent = "";
		}
	}

	// Get Ready Statuses
	socket.emit('get-ready-status', roomId, (player_ready) => getReadyStatus(player_ready));

	getCurrentPlayer(boardData);
	if(currentPlayer) enableBoard(boardData);
	else disableBoard();
}

function updateScore(score){
	document.querySelector('#p1 .player .score').textContent = score.p1;
	document.querySelector('#p2 .player .score').textContent = score.p2;
}

function setupTileListeners(socket){
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			rows[i].children[j].addEventListener('click', (event) => {
				if(ready && enemyReady){
					socket.emit('mark', roomId, playerNum, event.target.id);
					disableBoard();
				}
			});
		}
	}
}

function markCell(id, val, boardData){
	document.getElementById(id).textContent = val;
	if(!currentPlayer){ // Enemy went
		console.log('ENEMY WENT')
		enableBoard(boardData);
	}
	currentPlayer = !currentPlayer;
	vsPlay();
}

function updateStatus(status) {
	if(status.player1)
		document.querySelector('#p1 .player .connected span').classList.add('green');
	else
		document.querySelector('#p1 .player .connected span').classList.remove('green');
	if(status.player2)
		document.querySelector('#p2 .player .connected span').classList.add('green');
	else
		document.querySelector('#p2 .player .connected span').classList.remove('green');
	if(status.p1_ready)
		document.querySelector('#p1 .player .ready span').classList.add('green');
	else
		document.querySelector('#p1 .player .ready span').classList.remove('green');
	if(status.p2_ready)
		document.querySelector('#p2 .player .ready span').classList.add('green');
	else
		document.querySelector('#p2 .player .ready span').classList.remove('green');
}
 
function gameOver(socket, winner){
	disableBoard();
	socket.emit('get-score', roomId, (score) => {
		document.querySelector('#p1 .player .score').textContent = score.p1;
		document.querySelector('#p2 .player .score').textContent = score.p2;
	})
	document.getElementById('modal-backdrop').classList.toggle('hidden');
	document.getElementById('play-again-modal').classList.toggle('hidden');
	var winnerText;
	if(winner===0) winner = "Cat's Game!";
	else if (winner===1) winner = "X Wins!";
	else if (winner===2) winner = "O Wins!";
	document.getElementById('winner').textContent = winnerText;
}

function getCurrentPlayer(boardData){
	var usedSpaces = Object.values(Object.fromEntries(Object.entries(boardData).filter(([key, val]) => val)));
	console.log("== Used Spaces:", usedSpaces);
	currentPlayer = (playerNum===1) // assume player1
	if(usedSpaces){ // board has been played on
		//find Mode
		var modeMap = {};
		var maxEl = usedSpaces[0];
		for(var i = 0; i < usedSpaces.length; i++){
			var el = usedSpaces[i];
			if(modeMap[el] == null)
				modeMap[el] = 1;
			else
				modeMap[el]++;
		}
		// modeMap ex: {'X': 2, 'O': 1}
		console.log("modeMap:",modeMap)
		console.log("modeMap['X']:",modeMap['X'])
		console.log("modeMap['O']:",modeMap['O'])
		// 'X' val will always be >= 'O' val
		if((modeMap['X'] && modeMap['O']) && modeMap['X'] > modeMap['O']){
			currentPlayer = (playerNum===2);
		}
	}

	console.log(currentPlayer)
}

function playerConnectedOrDisconnected(num){
	let player = '#p' + (parseInt(num)) + " .player";
	document.querySelector(player + ' .connected span').classList.toggle('green')
	if(parseInt(num)===playerNum) document.querySelector(player).style.fontWeight = 'bold';
}

function enableBoard(boardData){
	var freeSpaces = Object.keys(Object.fromEntries(Object.entries(boardData).filter(([key, val]) => !val)));
	freeSpaces.forEach(e => document.getElementById(e).disabled = false);
}

function disableBoard(){
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			rows[i].children[j].disabled = true;
		}
	}
}

export default startMultiPlayer