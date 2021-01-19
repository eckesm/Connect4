/* ******************************************************************
--------------------------- CONNECT 4 ----------------------------
****************************************************************** */

/* DESCRIPTION
	--> Player 1 and 2 alternate turns. On each turn, a piece is dropped 		down a column until a player gets four-in-a-row (horiz, vert, or diag) or until board fills (tie).
	--> Players can update their game piece colors, the number of rows and columns in the game board, and the number of adjacent pieces requred to win.
	--> Colors and game board settings are saved to the browser's local storage. */

// __________________________________________________________________

/* TABLE OF CONTENTS

	(1) SETTINGS
 		settings object, localStorage retrieval, html element variable creation, const and let creation, starting state for several variables.\

	(2) makeBoard()
		creates array in JS to represent gameboard for logical processes.

	(3) makeBoardHtml()
		creates game board in html based on makeBoard() output, creates top row for move selection, creates playable game table, resets variables and elements for new game.
	
	(4) handleClick()
		triggered by player selecting a move.  Calls findSpotForCol() and placeInTable() to update the htmlBoard and board array.  Will end game as win or tie if necessary.
	
	(5) findSpotForCol()
		after player has selected a column in which to drop their piece, returns null (if the column is already full) or the row number of the lowest available cell.
		
	(6) placeInTable()
		creates a new div in htmlBoard after a player makes a move.
		
	(7) checkForWin()
		systematically checks every value in the board array to determine if the active player has won the game.
	
	(8) checkForWin()
		announces end of game as win or tie.
	
	(9) OTHER HELPER FUNCTIONS
		mouseenterColorSelector(), input controls, reset button visibility adjustments, collection of functions that run when any input is changed to update settings, localStorage save funciton.
	
	(10) FUNCTIONS & METHODS TO RUN ON LOAD
		makeBoard(), makeHtmlBoard(), updateGameHeading() and adding event listeners to html elements. */

/* ******************************************************************
----------------------------- SETTINGS ------------------------------
****************************************************************** */

const settings = {
	// default settings; these will be overwritten if there are settings saved in localStoarge.
	gridWidth  : 7,
	gridHeight : 6,
	connectNum : 4,
	p1Color    : '#ff0000',
	p2Color    : '#0000ff'
};

if (localStorage.getItem('connect4')) {
	// if settings were previous saved to localStorage, access and replace game board settings.
	const savedSettings = JSON.parse(localStorage.connect4);
	settings.gridWidth = savedSettings.gridWidth;
	settings.gridHeight = savedSettings.gridHeight;
	settings.connectNum = savedSettings.connectNum;
	settings.p1Color = savedSettings.p1Color;
	settings.p2Color = savedSettings.p2Color;
}

// CREATE CONST VARIABLES FOR OFTEN USED HTML ELEMENTS
const p1Color = document.getElementById('p1Color');
const p2Color = document.getElementById('p2Color');
const resetBtn = document.getElementById('resetbtn');

// CREATE LET VARIABLES FOR CONTROLLING VARIABLES
let board = []; // array of rows, each row is array of cells  (board[y][x])
let winner = false;

// STARTING STATE FOR SEVERAL VARIABLES
p1Color.value = settings.p1Color;
p2Color.value = settings.p2Color;
resetBtn.style.visibility = 'hidden';

/* ******************************************************************
---------------------------- makeBoard() ----------------------------
****************************************************************** */
/* DESCRIPTION
	--> makeBoard(): creates and populates JS board to HEIGHT x WIDTH matrix array.
	--> board = array of rows, each row is array of cells  (board[h][w]) */

function makeBoard() {
	board = [];
	for (let h = 0; h < settings.gridHeight; h++) {
		board.push([]);
		for (let w = 0; w < settings.gridWidth; w++) board[h].push(0);
	}
}

/* ******************************************************************
-------------------------- makeHtmlBoard() --------------------------
****************************************************************** */
/* DESCRIPTION
	--> makeHtmlBoard(): makes HTML table and row of column tops basd on board array created in makeBoard().
	--> htmlBoard: html board element
	--> if restarting the game, clears htmlBoard innerHTML before repopulating html elements. */

function makeHtmlBoard() {
	const htmlBoard = document.getElementById('board'); // get "htmlBoard" variable from the item in HTML w/ ID of "board"
	htmlBoard.innerHTML = ''; // clear board

	/* CREATE TOP ROW
	-->  create top row of game board in HTML as "tr" element, add id of "column-top", add 'click' event listener with callback handleClick()
	--> top = the row that changes color on hover; pieces cannot actually be played to any cell in this row. */
	const top = document.createElement('tr');
	top.setAttribute('id', 'column-top');
	top.addEventListener('click', handleClick);

	/* CREATE TD ELEMENTS IN TOP
	--> create "td" elements, adds id of board column number, populatestop with new cells, appends top as the first child element of htmlBoard.
	-- id and className are assigned for reference in subsequent processes.
	--> adds eventListener to each cell in the top row so that the cell's background color changes to the other player's color when clicked (to indicate that it is now the other player's turn once a selection has been made).
	--> adds eventListener to cells in top row that returns the background color to white on 'mouseleave' event */
	for (let w = 0; w < settings.gridWidth; w++) {
		const headCell = document.createElement('td');
		headCell.setAttribute('id', w);
		headCell.classList.add('topcell');
		headCell.addEventListener('click', e => {
			if (winner === true) {
				e.target.style.backgroundColor = 'white';
			} else {
				if (currPlayer === 1) e.target.style.backgroundColor = settings.p2Color;
				if (currPlayer === 2) e.target.style.backgroundColor = settings.p1Color;
			}
		});
		headCell.addEventListener('mouseleave', e => (e.target.style.backgroundColor = 'white'));
		top.append(headCell);
	}
	htmlBoard.append(top); // append top to htmlBoard

	/* CREATE HTML TABLE FOR PIECES
		--> creates a "tr" element for every game row.
		--> creates "td" in each new "tr" for each column of the game.
		--> adds ID to each "td" representing the row and column location
		--> appends new rows to gameBoard as siblings of top. */
	for (let h = 0; h < settings.gridHeight; h++) {
		const row = document.createElement('tr');
		row.classList.add('gameRow');
		for (var w = 0; w < settings.gridWidth; w++) {
			const cell = document.createElement('td');
			cell.setAttribute('id', `${h}-${w}`);
			row.append(cell);
		}
		htmlBoard.append(row);
	}

	/* RESET VARIABLES & ELEMENTS FOR NEW GAME
		--> currPlayer, colors, reset button, and winner status. */
	currPlayer = 1;
	mouseenterColorSelector();
	hideResetBtn();
	winner = false;
}

/* ******************************************************************
-------------------------- handleClick() ---------------------------
****************************************************************** */

/* DESCRIPTION
 --> handleClick(): handles click of column top to play piece.
 --> checks winner variable to prevent additional clicks before game is reset
 --> calls placeInTable() to update htmlBoard with new move.
 --> updated board array to reflect move.
 --> calls checkForWin() to determine if the currPlayer has won. On win: creates win messaging and calls endGame().
 --> checks for tie. On tie: creates tie messaging and calls endGame()
 --> switches the active player */

function handleClick(evt) {
	if (winner) return;

	// determines column (w) from ID of clicked top cell
	const w = +evt.target.id;

	// get next spot in column (if none, ignore click)
	const h = findSpotForCol(w);
	if (h === null) {
		return;
	}

	// place piece in board and add to HTML table
	placeInTable(h, w);

	// update board array
	board[h][w] = currPlayer;

	// check for win
	if (checkForWin())
		setTimeout(() => endGame(`Player ${currPlayer === 1 ? (currPlayer = 2) : (currPlayer = 1)} won!`), 1000);

	// check for tie: check if all cells in board are filled; if so call, call endGame
	if (board.every(arr => arr.every(el => el !== 0))) {
		setTimeout(
			() =>
				endGame(
					"It's a TIE, losers!\n\nAll of the spaces have been filled and neither player has won.... how embarassing for you!"
				),
			1000
		);
		winner = true;
	}

	// switch currPlayer 1 <-> 2
	if (currPlayer === 1) {
		currPlayer = 2;
	} else {
		currPlayer = 1;
	}
}

/* ******************************************************************
------------------------- findSpotForCol() --------------------------
****************************************************************** */

/* DESCRIPTION
	findSpotForCol(): given column w, return top empty h (null if filled) */

function findSpotForCol(w) {
	for (let h = settings.gridHeight - 1; h >= 0; h--) {
		if (board[h][w] === 0) return h;
	}
	return null;
}

/* ******************************************************************
-------------------------- placeInTable() ---------------------------
****************************************************************** */

/* DESCRIPTION
	--> placeInTable(): updates DOM to place piece into HTML table of board.
	--> when handleClick() is triggered by a player making a selction, gets correct table cell from findSpotForCol() and creates a div in htmlBoard. */

function placeInTable(h, w) {
	const tdAddDiv = document.getElementById(`${h}-${w}`);

	// make a div, add 'piece' class and player calss, insert into correct table cell
	const newDiv = document.createElement('div');
	newDiv.classList.add('piece');
	newDiv.classList.add(`p${currPlayer}`);
	if (currPlayer === 1) newDiv.style.backgroundColor = settings.p1Color;
	if (currPlayer === 2) newDiv.style.backgroundColor = settings.p2Color;
	tdAddDiv.append(newDiv);
}

/* ******************************************************************
--------------------------- checkForWin() ---------------------------
****************************************************************** */

/* DESCRIPTION
	--> checkForWin(): checks board cell-by-cell for "does a win start here?"
	--> starting with every potential cell, creates arrays of potential winning combinations and calls _win() to determine if the arrays contain only the pieces of the actuve player.
	--> the number of adjacent cells needed to win is dynamic, so array length varies based on Connect +/- selections. */

function checkForWin() {
	function _win(cells) {
		// Check cells to see if they're all color of current player
		//  - cells: list of # (y, x) cells
		//  - returns true if all are legal coordinates & all match currPlayer

		return cells.every(
			([ y, x ]) => y >= 0 && y < settings.gridHeight && x >= 0 && x < settings.gridWidth && board[y][x] === currPlayer
		);
	}

	// cycle through every cells every row
	// with cell as starting point, create arrays containing values of # spots to the right, # spots down, # spots diagonally right, and # spots diagonally right for a win
	// a win is achieved if any of these arrays contain entirely one player's number (ex: horiz = [ 2, 2, 2, 2 ])
	for (let y = 0; y < settings.gridHeight; y++) {
		for (let x = 0; x < settings.gridWidth; x++) {
			const horiz = [];
			for (let i = 0; i < settings.connectNum; i++) horiz.push([ y, x + i ]);

			const vert = [];
			for (let i = 0; i < settings.connectNum; i++) vert.push([ y + i, x ]);

			const diagDR = [];
			for (let i = 0; i < settings.connectNum; i++) diagDR.push([ y + i, x + i ]);

			const diagDL = [];
			for (let i = 0; i < settings.connectNum; i++) diagDL.push([ y + i, x - i ]);

			// player wins if horiz, vert, diagDR, or diagDL is true for the given y,x
			if (_win(horiz) || _win(vert) || _win(diagDR) || _win(diagDL)) {
				winner = true;
				return true;
			}
		}
	}
}

/* ******************************************************************
----------------------------- endGame() -----------------------------
****************************************************************** */

/* DESCRIPTION
	endGame(): announces game end on tie or win. */
function endGame(msg) {
	// pop up alert message
	alert(msg);
	showResetBtn();
}

/* ******************************************************************
----------------------- OTHER HELPER FUNCTIONS ----------------------
****************************************************************** */

mouseenterColorSelector = () => {
	/* DESCRIPTION
mouseenterColorSelector(): when player colors change, applies updated event listerner to top cells and change all existing game pieces to the new colors. */

	const topRowSquares = document.querySelectorAll('.topcell');
	const p1Pieces = document.querySelectorAll('.p1');
	const p2Pieces = document.querySelectorAll('.p2');

	settings.p1Color = p1Color.value;
	settings.p2Color = p2Color.value;
	updateLocalStorage();

	// adds event handler to show the current player's color when the mouse enter the cell
	for (let i = 0; i < topRowSquares.length; i++) {
		topRowSquares[i].addEventListener('mouseenter', e => {
			if (winner === true) {
				e.target.style.backgroundColor = 'white'; // prevents top background colors from changing after a win or tie
			} else {
				if (currPlayer === 1) e.target.style.backgroundColor = settings.p1Color;
				if (currPlayer === 2) e.target.style.backgroundColor = settings.p2Color;
			}
		});
	}
	// updates the background color of existing pieces on the html board if a player changes their player color.
	for (let i = 0; i < p1Pieces.length; i++) {
		p1Pieces[i].style.backgroundColor = settings.p1Color;
	}

	for (let i = 0; i < p2Pieces.length; i++) {
		p2Pieces[i].style.backgroundColor = settings.p2Color;
	}
};

// __________________________________________________________________

// ----- BUTTON CONTROLS -----

increaseGridHeight = () => {
	settings.gridHeight++;
	resetFunctions();
};

decreaseGridHeight = () => {
	if (settings.gridHeight > 3) {
		// prevents the grid height from being less than 3 rows
		settings.gridHeight--;
		resetFunctions();
	}
};

increaseGridWidth = () => {
	settings.gridWidth++;
	resetFunctions();
};

decreaseGridWidth = () => {
	if (settings.gridWidth > 3) {
		// prevents the grid width from being less than 3 columns
		settings.gridWidth--;
		resetFunctions();
	}
};

winNumIncrease = () => {
	settings.connectNum++;
	resetFunctions();
};

winNumDecrease = () => {
	if (settings.connectNum > 3) {
		// prevents the winning number of connected pieces required to win from being less than 3
		settings.connectNum--;
		resetFunctions();
	}
};

// __________________________________________________________________

// ----- OTHER AUXILLARY FUNCTIONS -----

updateGameHeading = () => {
	document.getElementById('gameheading').innerText = `Connect ${settings.connectNum}`;
};

hideResetBtn = () => {
	resetBtn.style.visibility = 'hidden';
};

showResetBtn = () => {
	resetBtn.style.visibility = 'visible';
};

updateLocalStorage = () => {
	localStorage.setItem('connect4', JSON.stringify(settings));
};

resetFunctions = () => {
	makeBoard();
	makeHtmlBoard();
	updateGameHeading();
	updateLocalStorage();
};

/* ******************************************************************
----------------- FUNCTIONS & METHODS TO RUN ON LOAD ----------------
****************************************************************** */

makeBoard();
makeHtmlBoard();
updateGameHeading();

// apply event handlers for input buttons
document.getElementById('heightincrease').addEventListener('click', increaseGridHeight);
document.getElementById('heightdecrease').addEventListener('click', decreaseGridHeight);
document.getElementById('widthincrease').addEventListener('click', increaseGridWidth);
document.getElementById('widthdecrease').addEventListener('click', decreaseGridWidth);
document.getElementById('winnumincrease').addEventListener('click', winNumIncrease);
document.getElementById('winnumdecrease').addEventListener('click', winNumDecrease);
p1Color.addEventListener('change', mouseenterColorSelector);
p2Color.addEventListener('change', mouseenterColorSelector);
resetBtn.addEventListener('click', resetFunctions);
