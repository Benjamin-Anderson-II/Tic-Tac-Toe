import startMultiPlayer from './multiPlayer.js'
import startSoloPlay from './singlePlayer.js'

const homeButtons = document.querySelectorAll('.return-home-button');

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