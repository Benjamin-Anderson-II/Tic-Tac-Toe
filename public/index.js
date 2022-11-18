var rows = document.querySelectorAll('.row');

let board = [
	['','',''],
	['','',''],
	['','','']];

let player1 = 'X';
let player2 = 'O';

let currentPlayer = true; // true = player 1

function updateBoard(event){
	switch(event.target.id){
//--------------TOP ROW--------------
	case 'top-left':
		board[0][0] = (currentPlayer) ? player1 : player2;
		break;
	case 'top-center':
		board[0][1] = (currentPlayer) ? player1 : player2;
		break;
	case 'top-right':
		board[0][2] = (currentPlayer) ? player1 : player2;
		break;
//--------------MIDDLE ROW--------------
	case 'mid-left':
		board[1][0] = (currentPlayer) ? player1 : player2;
		break;
	case 'mid-center':
		board[1][1] = (currentPlayer) ? player1 : player2;
		break;
	case 'mid-right':
		board[1][2] = (currentPlayer) ? player1 : player2;
		break;
//--------------BOTTOM ROW--------------
	case 'bot-left':
		board[2][0] = (currentPlayer) ? player1 : player2;
		break;
	case 'bot-center':
		board[2][1] = (currentPlayer) ? player1 : player2;
		break;
	case 'bot-right':
		board[2][2] = (currentPlayer) ? player1 : player2;
		break;

	}
}

function makeX(event){
	updateBoard(event);
	event.target.textContent = (currentPlayer) ? player1 : player2;;
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
			return;
		}
	}
	if((board[0][0]===board[1][1] && board[0][0]===board[2][2] && board[0][0]) || //diagonal 1
	   (board[0][2]===board[1][1] && board[2][0]===board[1][1] && board[1][1])){  //diagonal 2
		console.log((currentPlayer) ? player1 : player2, 'Wins!');
		disableBoard();
		//dislpayWinner(board[i][0]);
		return;
	}
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			if(!board[i][j]) return;
		}
	}
	console.log("Cat's Game")
}

function init(){
	for(var i = 0; i < 3; i++){
		for(var j  = 0; j < 3; j++){
			rows[i].children[j].textContent = board[i][j];
			rows[i].children[j].addEventListener('click', makeX);
		}
	}
}

init()