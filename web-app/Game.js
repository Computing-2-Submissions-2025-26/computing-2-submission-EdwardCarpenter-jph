// game.js
/* 
issues with ideas in main:
- rendering logic is supposed to go on the other side. 
    for simplicity, this is just going to be game logic
- game must be a data structure for marks (?)
    though we've been told the front end is what we're judged on.
*/

// separating these into 2 bits, since the alternative was confusing later on
const gridWidth = 12;
const gridDepth = 4;

function randomInt(min, max) { // simplifies random generation in a way i get more intuitively
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// making tiles one by one rather than in bulk
function createTile() {
  return {
    height: 0,
    occupant: null // may later become { team: "red"/"blue", hasRock: true/false }
  };
}

// this function is a suggested improvement from openAI's chatGPT
// this is *much* simpler than my iterative approach.
function createEmptyGrid() {
  return Array.from({ length: gridWidth }, () =>
    Array.from({ length: gridDepth }, () => createTile())
  );
}

// export function 
export function initGame() {
  return {
    grid: createEmptyGrid(),
    currentPlayer: "red",
    selected: null
  };
}