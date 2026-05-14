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
    Build visual top-tile map
  */

  const topMap = Array.from(
    { length: VISUAL_ROWS + 1 },
    () => Array(WIDTH).fill(false)
  );

  for (let z = 0; z < DEPTH; z++) {

    for (let x = 0; x < WIDTH; x++) {

      const tile = getTile(game, x, z);

      const topRow =
        VISUAL_ROWS
        - tile.height
        - z
        - 1;

      if (
        topRow >= 0 &&
        topRow < VISUAL_ROWS
      ) {
        topMap[topRow][x] = {
          tile,
          x,
          z
        };
      }
    }
  }

  /*
    Render full visual grid
  */

  for (let row = 0; row < VISUAL_ROWS; row++) {

    for (let x = 0; x < WIDTH; x++) {

      const topEntry = topMap[row][x];

      /*
        TOP TILE
      */

      if (topEntry) {

        renderTopTile(
          topEntry.tile,
          topEntry.x,
          topEntry.z,
          row
        );

        continue;
      }

      /*
        SKY OR SIDE TILE
      */

      let firstTopRow = null;

      for (let y = 0; y < VISUAL_ROWS; y++) {

        if (topMap[y][x]) {
          firstTopRow = y;
          break;
        }
      }

      /*
        Above first top = sky
      */

      if (
        firstTopRow === null ||
        row < firstTopRow
      ) {

        renderSkyTile(x, row);
        continue;
      }

      /*
        Immediate neighbour checks only
      */

      const topAbove =
        row > 0 &&
        Boolean(topMap[row - 1][x]);

      const topBelow =
        row < VISUAL_ROWS - 1 &&
        Boolean(topMap[row + 1][x]);

      renderSideTile(
        x,
        row,
        topAbove,
        topBelow
      );
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

function renderTopTile(tile, x, z, row) {

  const div = document.createElement("button");

  div.classList.add("tile");

  div.style.gridColumn = x + 1;
  div.style.gridRow = row + 1;

  div.style.zIndex = 2;

  const brightness = 0.5 + (tile.height * 0.2);

  div.style.filter =
    `brightness(${brightness})`;

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

function renderSkyTile(x, row) {

  const sky = document.createElement("div");

  sky.classList.add("tile");
  sky.classList.add("sky");

  sky.style.gridColumn = x + 1;
  sky.style.gridRow = row + 1;

  boardElement.appendChild(sky);
}

function renderSideTile(
  x,
  row,
  topAbove,
  topBelow
) {

  const side = document.createElement("div");

  side.classList.add("tile");
  side.classList.add("side");

  side.style.gridColumn = x + 1;
  side.style.gridRow = row + 1;

  side.style.zIndex = 1;

  let label = "~";

  if (topAbove && topBelow) {
    label = "=";
  } else if (topAbove) {
    label = "^";
  } else if (topBelow) {
    label = "v";
  }

  side.textContent = label;

  boardElement.appendChild(side);
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