import {
  initGame,
  selectTile,
  performAction,
  getTile,
  getCurrentPlayer,
  getWinner,
  getValidTargets,
  isLastGoon
} from "./game.js";

const boardElement = document.getElementById("board");
const redTurnDisplay = document.getElementById("red-turn-display");
const redWinnerDisplay = document.getElementById("red-winner-display");
const blueTurnDisplay = document.getElementById("blue-turn-display");
const blueWinnerDisplay = document.getElementById("blue-winner-display");
const resetButton = document.getElementById("reset-button");

// preload sprites
const ALL_SPRITES = [
  "Blanktop.png", "WeightTile.png",
  "RedtopLook.png", "RedtopAttend.png",
  "RedtopWeightLook.png", "RedtopWeightAttend.png",
  "BluetopLook.png", "BluetopAttend.png",
  "BlueTopWeightLook.png", "BluetopWeightAttend.png",
  "BrickTrans.png", "BrickStep.png", "BrickTop.png", "BrickBottom.png"
];

ALL_SPRITES.forEach(src => {
  const img = new Image();
  img.src = `./assets/tile/${src}`;
});

/*
  Accessibility, ai section
*/

boardElement.setAttribute(
  "aria-label",
  "Game board"
);

redTurnDisplay.setAttribute(
  "aria-live",
  "polite"
);

blueTurnDisplay.setAttribute(
  "aria-live",
  "polite"
);
// ai bit end


const WIDTH = 12;
const DEPTH = 4;//4

const VISUAL_ROWS = 12;

let selected = null;
let validTargets = [];

let game = initGame();

resetButton.addEventListener("click", () => {
  game = initGame();
  selected = null;
  render();
});

render();


function render() { // this section wasn't originally written by ai
  
  validTargets = getValidTargets(game);
  
  boardElement.innerHTML = "";

  const backgroundFog = document.createElement("img");

  backgroundFog.id = "background-fog";

  backgroundFog.src =
    "./assets/tile/BackFog.png";

  boardElement.appendChild(backgroundFog);

  const winner = getWinner(game);
  const currentPlayer = getCurrentPlayer(game);

  if (winner) {
    if (winner === "red") {
      redTurnDisplay.textContent = `Red wins!`;
      blueTurnDisplay.textContent = ``;
    } else {
      blueTurnDisplay.textContent = `Blue wins!`
      redTurnDisplay.textContent = ``;
    }

  } else {
    if (currentPlayer === "red") {
      redTurnDisplay.textContent =`Current turn: RED`;
      blueTurnDisplay.textContent =``;
    } else {
      blueTurnDisplay.textContent=`Current turn:BLUE`
      redTurnDisplay.textContent =``;
    }
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

/* unimplemented sky tile code; background was preferred.
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
}*/

function createSprite(src) {
  const img = document.createElement("img");

  img.classList.add("tile-sprite");
  img.src = `./assets/tile/${src}`;

  img.alt = "";

  return img;
}

function renderTopTile(tile, x, z, row) {

  const div = document.createElement("button");

  div.classList.add("tile");
  
  const isValidTarget = validTargets.some(([vx, vz]) => vx === x && vz === z);

  div.classList.toggle("valid-target", isValidTarget);
  
  div.style.gridColumn = x + 1;
  div.style.gridRow = row + 1;

  div.style.zIndex = 2;

  const brightness = 0.5 + (tile.height * 0.25);

  /*
    Front rows more contrasted.
    Back rows more washed out.
  */
  const contrast = 1.5 - (z * 0.4);

  //const saturation = 1 // tried this, didn't work great
    //2.0 - (z * 0.5);
const validFilter = isValidTarget
    ? " sepia(0.6) saturate(2.5) hue-rotate(20deg)"
    : "";

  div.style.filter =
    `brightness(${brightness}) contrast(${contrast})${validFilter}`;

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

    // adding ai code in here for aria accessibility
    let label = `Column ${x + 1}, layer ${z + 1}`;

if (tile.occupant?.type === "rock") {
  label += ", rock";
}

if (tile.occupant?.type === "character") {

  label += `, ${tile.occupant.team} goon`;

  if (tile.occupant.hasRock) {
    label += ", carrying a Ten Ton Weight!";
  }
}

if (
  selected &&
  selected.x === x &&
  selected.z === z
) {
  label += ", selected";
}

div.setAttribute("aria-label", label);
// ai code end

    if (character.team === "red") {

      if (character.hasRock) {

        sprite = isSelected
          ? "RedtopWeightAttend.png"
          : "RedtopWeightLook.png";

      } else {

        sprite = isSelected
          ? "RedtopAttend.png"
          : "RedtopLook.png";
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

/* more unimplemented sky tile code
function renderSkyTile(x, row) {
}*/

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
  const tile = getTile(game, x, z);
  const clickedOwnCharacter =
    tile &&
    tile.occupant &&
    tile.occupant.type === "character" &&
    tile.occupant.team === getCurrentPlayer(game);

  const clickedSelectedTile =
    game.selected && x === selected.x && z === selected.z;

  if (clickedSelectedTile && isLastGoon(game)) {
    // this is more game logic adjacent than may be preferable, but it's a UX issue that was simpler to fix on this end
    // i initially had deselecting impossible as a deliberate part of the game, since it led to humerous game situations,
    // however, many users including my peer reviewer simply found it irritating, so i replaced it.
    game = performAction(game, [x, z]);
  } else if (game.selected && (clickedOwnCharacter || clickedSelectedTile)) {
    game = selectTile(game, x, z);
  } else if (game.selected) {
    game = performAction(game, [x, z]);
  } else {
    game = selectTile(game, x, z);
  }

  selected = game.selected ? {x: game.selected[0], z: game.selected[1]} : null;
  render();
}