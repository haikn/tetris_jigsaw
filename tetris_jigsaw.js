/**
 * @file: tetris_jigsaw.js
 * @author: Nam Hai Khuc
 * @date: 08 May 2017
 * @pure javascript only
 */

var board;
// Grid 4x4, 4 pieces
var rows = 4, cols = 4, nTetraminos = 4;
var blocks;
var blocksPost=0;

/**
 * Use event listener
 */
this.addEventListener('message', function(e){
	
	blocks = organizePieces(e.data);
	if(!blocks) {
		postMessage("incorrect_data");
	}
	
	// Re-assign number of tetraminos
	nTetraminos = blocks.length;
    // Draw board
	board=new Array(rows);
	for(var y=0;y<board.length;y++) {
		board[y]=new Array(cols); 
		for(var x=0;x<board[0].length;x++) {
			board[y][x]=0;
		}
	}
	tetrisJigsawResolve();
}, false);

function sendFilledPieces(){
	if(board){
		var s="filled "+board.length+" "+board[0].length+" ";
		for(var y=0;y<board.length;y++) 
			for(var x=0;x<board[0].length;x++) 
				s+=board[y][x]+" ";
		postMessage(s);
	}
}

var t=Date.now();

/**
 * Communicate thru web worker by sending postMessage signal
 * @returns
 */
function tetrisJigsawResolve() {
	if(nTetraminos*4!=rows*cols) {
		postMessage("incorrect_file_format"); //cannot be filled by tetraminos
	}
	else if(trialAndError(1)) {
		sendFilledPieces(); 
		postMessage("finished");
	} else  {
		postMessage("incorrect_data");
	}
}

/**
 * Check if block has been filled by piece
 * @param y
 * @param x
 * @returns
 */
function isOccupied(y, x) {
        return y >= 0 && y < rows && x >= 0 && x < cols ? board[y][x] != 0 : true;
}

function group(y,x){
	if (y >= 0 && y < rows && x >= 0 && x < cols && board[y][x] == 0) {
		board[y][x] = -1;
		return 1 + group(y, x + 1) + group(y, x - 1) + group(y + 1, x) + group(y - 1, x);
	}
	return 0;  
}

/**
 * Clean up blocks
 * @returns
 */
function cleanupBlocks(){
	for (var y = 0; y < rows; y++) {
		for (var x = 0; x < cols; x++) {
			if (board[y][x] == -1) {
				board[y][x] = 0;
			}
		}
	}
}

/**
 * Check right place settle for the piece
 * @returns
 */
function isRightPlaceSettle(){
	for (var y = 0; y < rows; y++) {
		for (var x = 0; x < cols; x++) {
			if (board[y][x] == 0) {
				if (group(y, x) % 4 != 0) {
					cleanupBlocks();
					return true; //cannot be filled by tetraminos
				}
			}
		}
	}
	cleanupBlocks();
	return false;
}

/**
 * Try to put piece into the grid
 * @param p
 * @returns
 */
function trialAndError(p){
	if(Date.now()-t>20){
		sendFilledPieces();
		t=Date.now();
	}
	if (blocksPost>=blocks.length) {
		return true; //puzzle is solved
	}
	
	var block=blocks[blocksPost++];
	for (var y = 0; y <= rows - block[4][1]; y++) {
		for (var x = 0; x <= cols - block[4][0]; x++) {
			if (board[y + block[0][1]][x + block[0][0]] == 0 && board[y + block[1][1]][x + block[1][0]] == 0 && board[y + block[2][1]][x + block[2][0]] == 0 && board[y + block[3][1]][x + block[3][0]] == 0) {
				// Somewhere fit for this piece
				board[y + block[0][1]][x + block[0][0]] = p;
				board[y + block[1][1]][x + block[1][0]] = p;
				board[y + block[2][1]][x + block[2][0]] = p;
				board[y + block[3][1]][x + block[3][0]] = p;
				if(!isRightPlaceSettle()) {
					if (trialAndError(p + 1)) {
						return true; //this is the right place for this piece
					}
				}
				// Reset block post
				board[y + block[0][1]][x + block[0][0]] = 0;
				board[y + block[1][1]][x + block[1][0]] = 0;
				board[y + block[2][1]][x + block[2][0]] = 0;
				board[y + block[3][1]][x + block[3][0]] = 0;
			}
		}
	}
	blocksPost--;
	return false; //No fit place found
}

/**
 * Analyze input data - from a text file
 */
function organizePieces(input_data) {
	var tetraminos = [];
	var coordinates = [];
	for(var i = 0; i < input_data.length; i++) {
		var str = input_data[i].replace(/\s/g, '');
		var tetraminos = str.split(/:|;/);
		if(tetraminos.length == 5) {
			var piece_axis = [];
			var rows = 0, cols = 0, min_y = 0, max_y = 0, min_x = 0, max_x = 0;
			for(var j = 1; j < tetraminos.length; j++) {
				var axis = tetraminos[j].split(",");
				if(axis.length != 2) {
					return false;
				}
				if(parseInt(axis[1]) < min_y) min_y = parseInt(axis[1]);
				if(parseInt(axis[1]) > max_y) max_y = parseInt(axis[1]);
				if(parseInt(axis[0]) < min_x) min_x = parseInt(axis[0]);
				if(parseInt(axis[0]) > max_x) max_x = parseInt(axis[0]);
				cols = Math.abs(min_x) + Math.abs(max_x) + 1;
				rows = Math.abs(min_y) + Math.abs(max_y) + 1;
			}

			// Re-organize input data
			for(var j = 1; j < tetraminos.length; j++) {
				var axis = tetraminos[j].split(",");
				var new_y = rows - (parseInt(axis[1]) - min_y)-1;
				piece_axis.push([parseInt(axis[0]), new_y]);
			}
			piece_axis.push([cols,rows]);
			
			coordinates.push(piece_axis);
		} else {
			return false; // Incorrect data
		}
		
	}
	return coordinates;
}
