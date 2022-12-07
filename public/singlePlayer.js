const rows = document.querySelectorAll('.row');
const forfeitButton = document.querySelector("#forfeit-button");
const infoDisplay = document.querySelector('#info-display');
const turnDislay = document.querySelector("#turn-display");
const playAgainButton = document.querySelector('#play-again-button');


let board = {
	"topLeft": "",
	"topCenter": "",
	"topRight": "",
	"midLeft": "",
	"midCenter": "",
	"midRight": "",
	"botLeft": "",
	"botCenter": "",
	"botRight": ""
};

const user = 'X';
const computer = 'O';
let currentPlayer = true; // true = player 1
let gameMode = 'impossible'

function startSoloPlay(){
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			rows[i].children[j].textContent = board[3*i+j];
			rows[i].children[j].addEventListener('click', handleTilePlace);
		}
	}
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

function handleTilePlace(event){
	board[event.target.id] = user;
	event.target.textContent = user;
	event.target.disabled = true;
	if (!checkWinner()){
		currentPlayer = !currentPlayer;

		//Disable Board
		disableBoard();

		//Begin Computer Turn
		if(gameMode === 'easy')
			computerRandom();
		else if(gameMode  === 'impossible')
			computerBestMove();
	} else {
		disableBoard();
		//winning stuffs
	}
}

function computerRandom(){
	var availableSpaces = [];
	for(var i = 0; i < Object.keys(board).length; i++)
		if(!(board[Object.keys(board)[i]]))
			availableSpaces.push(Object.keys(board)[i]);

	var chosenSpot = Math.floor(Math.random() * availableSpaces.length)

	board[availableSpaces[chosenSpot]] = computer;
	document.getElementById(availableSpaces[chosenSpot]).textContent = computer;
	currentPlayer = !currentPlayer;
	enableBoard();
}

function computerBestMove(){
	var bestScore = -Infinity;
	var bestMove;
	for(var i = 0; i < Object.keys(board).length; i++){
		var currCellID = Object.keys(board)[i];
		// Is the spot available?
		if(!(board[currCellID])){
			board[currCellID] = computer;
			var score = minimax(board, 0, false);
			board[currCellID] = '';
			if(score > bestScore) {
				bestScore = score;
				bestMove = currCellID;
			}
		}
	}
	board[bestMove] = computer;
	document.getElementById(bestMove).textContent = computer;
	currentPlayer = !currentPlayer;
	enableBoard();
}

var scores = {
	X: -1,
	O: 1,
	tie: 0
}

function minimax(board, depth, isMaximizing){
	var result = checkWinner();
	if(result){
		return scores[result];
	}

	if(isMaximizing) {
		var bestScore = -Infinity;
		for(var i = 0; i < Object.keys(board).length; i++){
			var currCellID = Object.keys(board)[i];
			// Is the spot available?
			if(!(board[currCellID])){
				board[currCellID] = computer;
				var score = minimax(board, depth+1, false);
				board[currCellID] = '';
				bestScore = Math.max(score, bestScore)
			}
		}
		return bestScore;
	} else {
		var bestScore = Infinity;
		for(var i = 0; i < Object.keys(board).length; i++){
			var currCellID = Object.keys(board)[i];
			// Is the spot available?
			if(!(board[currCellID])){
				board[currCellID] = user;
				var score = minimax(board, depth+1, true);
				board[currCellID] = '';
				bestScore = Math.min(score, bestScore)
			}
		}
		return bestScore;
	}
}

function disableBoard(){
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			rows[i].children[j].disabled = true;
		}
	}
}

function enableBoard(){
	Object.entries(board).forEach( (e) => {if(!e[1]) document.getElementById(e[0]).disabled = false});
}

function equals3(a, b, c) {
	return a == b && a == c && a;
}

function checkWinner(){
	var cellData = Object.values(board);
	
	// Horizontal
	for(var i = 0; i < 3; i++){
		if(equals3(cellData[3*i+0], cellData[3*i+1], cellData[3*i+2]))
			return cellData[3*i];
	}

	// Vertical
	for(var j = 0; j < 3; j++){
		if(equals3(cellData[3*0+j], cellData[3*1+j], cellData[3*2+j]))
			return cellData[j];
	}

	// Diagonals
	if(equals3(cellData[0], cellData[4], cellData[8]))
		return cellData[0];

	if(equals3(cellData[2], cellData[4], cellData[6]))
		return cellData[2];

	//check for cat's game
	var cat = true;
	for(var i = 0; i < cellData.length; i++)
		if(!cellData[i]) cat = false;
	if(cat){
		console.log("cat's game");
		return 'tie';
	}

	return false;
}

export default startSoloPlay