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

const WIDTH = 12;
const DEPTH = 4;

const VISUAL_ROWS = 12;

let selected = null;

let game = initGame();

render();

function render() {
  boardElement.innerHTML = "";

  const winner = getWinner(game);

  if (winner) {
    winnerDisplay.textContent = `${winner} wins!`;
  } else {
    winnerDisplay.textContent = "";
  }

  const currentPlayer = getCurrentPlayer(game);

  turnDisplay.textContent =
    `Current turn: ${currentPlayer.toUpperCase()}`;

  /*
    IMPORTANT:

    Render back rows first.
    Front rows last.
  */
  for (let z = 0; z < DEPTH; z++) {

    for (let x = 0; x < WIDTH; x++) {

      const tile = getTile(game, x, z);

      const tileElement = createTileElement(tile, x, z);

      boardElement.appendChild(tileElement);
    }
  }
}

function createTileElement(tile, x, z) {

  const div = document.createElement("button");

  div.classList.add("tile");

  /*
    Visual grid system.

    Height pushes upward.
    Depth pushes upward.
  */
  const visualRow =
    VISUAL_ROWS
    - tile.height
    - z
    - 1;

  const visualColumn = x + 1;

  div.style.gridColumn = visualColumn;
  div.style.gridRow = visualRow;

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

  return div;
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