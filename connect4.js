/* Connect Four
 
Player 1 and 2 alternate turns. On each turn, a piece is dropped down a column until a player gets four-in-a-row (horiz, vert, or diag) or until board fills (tie) */


// TODO: replace css formatting with js that enables players to pick colors?
// let p1Color= document.getElementById('p1Color').value
// let p2Color=document.getElementById('p2Color').value
const settings = {
	gridWidth  : 7,
	gridHeight : 6,
  connectNum : 4,
  p1Color:'#ff0000',
  p2Color: '#0000ff'
};

if (localStorage.getItem('connect4')){
  const savedSettings = JSON.parse(localStorage.connect4)
  settings.gridWidth=savedSettings.gridWidth
  settings.gridHeight=savedSettings.gridHeight
  settings.connectNum=savedSettings.connectNum
  settings.p1Color=savedSettings.p1Color
  settings.p2Color=savedSettings.p2Color
}

document.getElementById('p1Color').value=settings.p1Color
document.getElementById('p2Color').value=settings.p2Color
const resetBtn=document.getElementById('resetbtn')
resetBtn.style.visibility="hidden"

// let currPlayer = 1; // active player: 1 or 2
let board = []; // array of rows, each row is array of cells  (board[y][x])
let winner=false

// makeBoard: creates populates JS board to HEIGHT x WIDTH matrix array
function makeBoard() {
  board=[]
  for (let h = 0; h < settings.gridHeight; h++) {
		board.push([]);
		for (let w = 0; w < settings.gridWidth; w++) board[h].push(0);
	}
	// board = array of rows, each row is array of cells  (board[h][w])
}

// makeHtmlBoard(): make HTML table and row of column tops.
function makeHtmlBoard() {
	// get "htmlBoard" variable from the item in HTML w/ ID of "board", clear board
  const htmlBoard = document.getElementById('board');
  htmlBoard.innerHTML=''

	// create top row of game board in HTML as "tr" element, add id of "column-top", add 'click' event listener with callback handleClick()
	// top = the row that changes color on hover; pieces cannot actually be played to any cell in this row.
	const top = document.createElement('tr');
	top.setAttribute('id', 'column-top');
	top.addEventListener('click', handleClick);

	// create "td" elements, add id of board column number, populate top with new cells
	for (let w = 0; w < settings.gridWidth; w++) {
		const headCell = document.createElement('td');
		headCell.setAttribute('id', w);
		headCell.classList.add('topcell');
		headCell.addEventListener('click', e => {
			if (currPlayer === 1) e.target.style.backgroundColor = settings.p2Color;
      if (currPlayer === 2) e.target.style.backgroundColor = settings.p1Color;
		});
		headCell.addEventListener('mouseleave', e => (e.target.style.backgroundColor = 'white'));
		top.append(headCell);
	}
	htmlBoard.append(top); // append top to htmlBoard

	// create a "tr" element for every game row, create "td" in each new "tr" for each column of the game, add ID to each "td" representing the row and column location, append new rows of new cells to gameBoard
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
  // reset currPlayer, colors, reset button, and winner status
  currPlayer = 1  // active player: 1 or 2
  mouseenterColorSelector()
  hideResetBtn()
  winner=false
}

/** findSpotForCol(): given column x, return top empty y (null if filled) */

function findSpotForCol(w) {
	// TODO: write the real version of this, rather than always returning 0

	for (let h = settings.gridHeight - 1; h >= 0; h--) {
		if (board[h][w] === 0) return h;
	}
	return null;
}

// placeInTable(): update DOM to place piece into HTML table of board
function placeInTable(h, w) {
	// get correct table cell
	const tdAddDiv = document.getElementById(`${h}-${w}`);

	// make a div, add 'piece' class and player calss, insert into correct table cell
	const newDiv = document.createElement('div');
	newDiv.classList.add('piece');
	newDiv.classList.add(`p${currPlayer}`);
	if (currPlayer === 1) newDiv.style.backgroundColor = settings.p1Color;
	if (currPlayer === 2) newDiv.style.backgroundColor = settings.p2Color;
	tdAddDiv.append(newDiv);
}

// endGame: announce game end
function endGame(msg) {
	// pop up alert message
  alert(msg);
  showResetBtn()
}

// handleClick: handle click of column top to play piece
function handleClick(evt) {
  if (winner) return // in order to prevent additional clicks before game is reset

  // get column (w) from ID of clicked cell
  const w = +evt.target.id;

	// get next spot in column (if none, ignore click)
	const h = findSpotForCol(w);
	if (h === null) {
		return;
	}

	// place piece in board and add to HTML table
	placeInTable(h, w);

	// add line to update in-memory board
	board[h][w] = currPlayer;

	// check for win
	if (checkForWin()) setTimeout(() => endGame(`Player ${currPlayer===1 ? currPlayer=2 : currPlayer=1} won!`), 1000);

	// check for tie: check if all cells in board are filled; if so call, call endGame
	if (board.every(arr => arr.every(el => el !== 0)))
		setTimeout(
			() =>
				endGame(
					"It's a TIE, losers!\n\nAll of the spaces have been filled and neither player has won.... how embarassing for you!"
				),
			1000
		);

	// switch currPlayer 1 <-> 2
	if (currPlayer === 1) {
		currPlayer = 2;
	} else {
		currPlayer = 1;
	}
}

// checkForWin: check board cell-by-cell for "does a win start here?"
function checkForWin() {
	function _win(cells) {
		// Check four cells to see if they're all color of current player
		//  - cells: list of four (y, x) cells
		//  - returns true if all are legal coordinates & all match currPlayer

		return cells.every(
			([ y, x ]) => y >= 0 && y < settings.gridHeight && x >= 0 && x < settings.gridWidth && board[y][x] === currPlayer
		);
	}

	// cycle through every cells every row
	// with cell as starting point, create arrays containing values of four spots to the right, four spots down, four spots diagonally right, and four spots diagonally right for a win
	// a win is achieved if any of these arrays contain entirely one player's number (ex: horiz = [ 2, 2, 2, 2 ])
	for (let y = 0; y < settings.gridHeight; y++) {
		for (let x = 0; x < settings.gridWidth; x++) {
			// const horiz = [ [ y, x ], [ y, x + 1 ], [ y, x + 2 ], [ y, x + 3 ] ];
			// const vert = [ [ y, x ], [ y + 1, x ], [ y + 2, x ], [ y + 3, x ] ];
			// const diagDR = [ [ y, x ], [ y + 1, x + 1 ], [ y + 2, x + 2 ], [ y + 3, x + 3 ] ];
			// const diagDL = [ [ y, x ], [ y + 1, x - 1 ], [ y + 2, x - 2 ], [ y + 3, x - 3 ] ];

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
        winner=true
				return true;
			}
		}
	}
}

mouseenterColorSelector = () => {
	// add event handler for hover color of top row
	const topRowSquares = document.querySelectorAll('.topcell');
	const p1Pieces = document.querySelectorAll('.p1');
	const p2Pieces = document.querySelectorAll('.p2');
  
  settings.p1Color = document.getElementById('p1Color').value;
  settings.p2Color = document.getElementById('p2Color').value;
  updateLocalStorage()

	for (let i = 0; i < topRowSquares.length; i++) {
		topRowSquares[i].addEventListener('mouseenter', e => {
			if (currPlayer === 1) e.target.style.backgroundColor = settings.p1Color;
			if (currPlayer === 2) e.target.style.backgroundColor = settings.p2Color;
		});
	}

	for (let i = 0; i < p1Pieces.length; i++) {
		p1Pieces[i].style.backgroundColor = settings.p1Color;
	}

	for (let i = 0; i < p2Pieces.length; i++) {
		p2Pieces[i].style.backgroundColor = settings.p2Color;
	}
};

// button controls
increaseGridHeight=()=>{
  settings.gridHeight++
  resetFunctions()
}

decreaseGridHeight=()=>{
  settings.gridHeight--
  resetFunctions()
}

increaseGridWidth=()=>{
  settings.gridWidth++
  resetFunctions()
}

decreaseGridWidth=()=>{
  settings.gridWidth--
  resetFunctions()
}

winNumIncrease=()=>{
  settings.connectNum++
  resetFunctions()
}

winNumDecrease=()=>{
  settings.connectNum--
  resetFunctions()
}

updateLocalStorage=()=>{
  localStorage.setItem('connect4',JSON.stringify(settings))
}

updateGameHeading=()=>{
  document.getElementById('gameheading').innerText=`Connect ${settings.connectNum}`
}

hideResetBtn=()=>{
  resetBtn.style.visibility='hidden'
}

showResetBtn=()=>{
  resetBtn.style.visibility='visible'
}

resetFunctions=()=>{
  makeBoard();
  makeHtmlBoard();  
  updateGameHeading()
  updateLocalStorage()
}

// functions to run on load
makeBoard();
makeHtmlBoard();
updateGameHeading()

// apply event handlers for input buttons
document.getElementById('heightincrease').addEventListener('click', increaseGridHeight);
document.getElementById('heightdecrease').addEventListener('click', decreaseGridHeight);
document.getElementById('widthincrease').addEventListener('click', increaseGridWidth);
document.getElementById('widthdecrease').addEventListener('click', decreaseGridWidth);
document.getElementById('winnumincrease').addEventListener('click', winNumIncrease);
document.getElementById('winnumdecrease').addEventListener('click', winNumDecrease);
document.getElementById('p1Color').addEventListener('change', mouseenterColorSelector);
document.getElementById('p2Color').addEventListener('change', mouseenterColorSelector);
resetBtn.addEventListener('click',resetFunctions)
