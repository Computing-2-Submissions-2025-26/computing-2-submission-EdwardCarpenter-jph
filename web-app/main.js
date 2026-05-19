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
const DEPTH = 4;//4

const VISUAL_ROWS = 12;

let selected = null;

let game = initGame();

resetButton.addEventListener("click", () => {
  game = initGame();
  selected = null;
  render();
});

render();


function render() { // this section wasn't originally written by ai

  boardElement.innerHTML = "";

  const backgroundFog = document.createElement("img");

  backgroundFog.id = "background-fog";

  backgroundFog.src =
    "./assets/tile/BackFog.png";

  boardElement.appendChild(backgroundFog);

  const winner = getWinner(game);
  const currentPlayer = getCurrentPlayer(game);

  if (winner) {
    turnDisplay.textContent = `${winner} wins!`;
  } else {
    turnDisplay.textContent =`Current turn: ${currentPlayer.toUpperCase()}`;
  }

  


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

function createSprite(src) {

  const img = document.createElement("img");

  img.classList.add("tile-sprite");

  img.src = `./assets/tile/${src}`;

  return img;
}

function renderTopTile(tile, x, z, row) {

  const div = document.createElement("button");

  div.classList.add("tile");

  div.style.gridColumn = x + 1;
  div.style.gridRow = row + 1;

  div.style.zIndex = 2;

  const brightness = 0.4 + (tile.height * 0.3);

  /*
    Front rows more contrasted.
    Back rows more washed out.
  */
  const contrast = 1.5 - (z * 0.3);

  const saturation = 1 // tried this, didn't work great
    //2.0 - (z * 0.5);

  div.style.filter =
    `brightness(${brightness}) contrast(${contrast})`;

  let sprite = "Blanktop.png";

  if (
    tile.occupant &&
    tile.occupant.type === "rock"
  ) {
    sprite = "WeightTile.png";
  }

  if (
    tile.occupant &&
    tile.occupant.type === "character"
  ) {

    const character = tile.occupant;

    const isSelected =
      selected &&
      selected.x === x &&
      selected.z === z;

    if (character.team === "red") {

      if (character.hasRock) {

        sprite = isSelected
          ? "RedtopWeightAttend.png"
          : "RedtopWeightLook.png";

      } else {

        sprite = isSelected
          ? "RedtopAttend.png"
          : "RedtopLookpng.png";
      }
    }

    if (character.team === "blue") {

      if (character.hasRock) {

        sprite = isSelected
          ? "BluetopWeightAttend.png"
          : "BlueTopWeightLook.png";

      } else {

        sprite = isSelected
          ? "BluetopAttend.png"
          : "BluetopLook.png";
      }
    }
  }

  const winner = getWinner(game);

  if (
    winner &&
    tile.occupant &&
    tile.occupant.type === "character" &&
    tile.occupant.team === winner
  ) {

    sprite =
      winner === "red"
        ? "RedCelebrate.gif"
        : "BlueCelebrate.gif";
  }

  div.appendChild(createSprite(sprite));

  /*
    Watermark depth cues
  */

  const label = document.createElement("div");

  label.classList.add("tile-label");

  label.textContent =
    `R${z + 1} H${tile.height}`;

  div.appendChild(label);

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

  let sprite = "BrickTrans.png";

  if (topAbove && topBelow) {
    sprite = "BrickStep.png";
  } else if (topAbove) {
    sprite = "BrickTop.png";
  } else if (topBelow) {
    sprite = "BrickBottom.png";
  }

  side.appendChild(
    createSprite(sprite)
  );

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