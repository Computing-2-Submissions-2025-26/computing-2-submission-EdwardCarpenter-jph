// most of the code in this file is straight up just chatgpt code; i want to test the game manually
// and i can improve this code myself later
import {
  initGame,
  selectTile,
  performAction,
  getTile,
  getCurrentPlayer,
  getWinner
} from "./game.js";

const boardElement = document.getElementById("board");
const turnDisplay = document.getElementById("turn-display");
const winnerDisplay = document.getElementById("winner-display");
const resetButton = document.getElementById("reset-button");

const WIDTH = 12;
const DEPTH = 4;

const VISUAL_ROWS = 12;

let selected = null;

let game = initGame();

resetButton.addEventListener("click", () => {
  game = initGame();
  selected = null;
  render();
});

render();

function render() {

  boardElement.innerHTML = "";

  renderSky();

  const winner = getWinner(game);

  if (winner) {
    winnerDisplay.textContent = `${winner} wins!`;
  } else {
    winnerDisplay.textContent = "";
  }

  const currentPlayer = getCurrentPlayer(game);

  turnDisplay.textContent =
    `Current turn: ${currentPlayer.toUpperCase()}`;

  for (let z = 0; z < DEPTH; z++) {

    for (let x = 0; x < WIDTH; x++) {

      const tile = getTile(game, x, z);

      renderColumn(tile, x, z);
    }
  }
}

function renderSky() {

  for (let row = 1; row <= VISUAL_ROWS; row++) {

    for (let col = 1; col <= WIDTH; col++) {

      const sky = document.createElement("div");

      sky.classList.add("tile");
      sky.classList.add("sky");

      sky.style.gridColumn = col;
      sky.style.gridRow = row;

      boardElement.appendChild(sky);
    }
  }
}

function renderColumn(tile, x, z) {

  const topRow =
    VISUAL_ROWS
    - tile.height
    - z
    - 1;

  /*
    SIDE TILES
  */

  for (
    let row = VISUAL_ROWS - z;
    row > topRow;
    row -= 1
  ) {

    const side = document.createElement("div");

    side.classList.add("tile");
    side.classList.add("side");

    side.style.gridColumn = x + 1;
    side.style.gridRow = row;

    /*
      Ensure tops render above sides
    */
    side.style.zIndex = 1;

    /*
      Darken distant tiles
    */
    side.style.filter =
      `brightness(${1 - (z * 0.12)})`; // note: this does not work!

    /*
      Determine side type
    */

    let sideLabel = "~";

    const tileAbove =
      row === topRow + 1;

    const tileBelow =
      row === VISUAL_ROWS - z;

    if (tileAbove && tileBelow) {
      sideLabel = "=";
    } else if (tileAbove) {
      sideLabel = "^";
    } else if (tileBelow) {
      sideLabel = "v";
    }

    side.textContent = sideLabel;

    boardElement.appendChild(side);
  }

  /*
    TOP TILE
  */

  const div = document.createElement("button");

  div.classList.add("tile");

  /*
    Tops above sides
  */
  div.style.zIndex = 2;

  const brightness = 0.4+(tile.height * 0.15);

  div.style.filter =
    `brightness(${brightness})`;

  div.style.gridColumn = x + 1;
  div.style.gridRow = topRow;

  let label = `R${z + 1} H${tile.height}`;

  if (tile.occupant) {

    if (tile.occupant.type === "rock") {
      div.classList.add("rock");
      label += "\nROCK";
    }

    if (tile.occupant.type === "character") {

      div.classList.add(tile.occupant.team);

      label += `\n${tile.occupant.team}`;

      if (tile.occupant.hasRock) {
        label += "/Rk";
      }
    }

  } else {
    div.classList.add("empty");
  }

  div.textContent = label;

  if (
    selected &&
    selected.x === x &&
    selected.z === z
  ) {
    div.classList.add("selected");
  }

  div.addEventListener("click", () => {
    handleTileClick(x, z);
  });

  boardElement.appendChild(div);
}

function handleTileClick(x, z) {

  if (game.selected) {
    game = performAction(game, [x, z]);
  } else {
    game = selectTile(game, x, z);
  }

  selected = game.selected
    ? {x: game.selected[0], z: game.selected[1]}
    : null;

  render();
}