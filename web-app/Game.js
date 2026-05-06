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

function generateHeights(grid) {
  for (let x = 0; x < gridWidth; x += 1) {
    // first row
    grid[x][0].height = Math.floor(randomInt(0, 2));

    // rest of column
    for (let z = 1; z < gridDepth; z += 1) { // i started the last one at 0, which can ask for -1
      const prevHeight = grid[x][z - 1].height; //now storing seperate for safety

      // ensure it doesn't go down
      grid[x][z].height = randomInt(prevHeight, prevHeight + 2);
    }
  }
}


function isSameTile(a, b) { // previously this came up a lot and led to a lot of unreadable gibberish
  return a[0] === b[0] && a[1] === b[1]; // apparently comparing arrays sucks.
}

function isTaken(taken, tile) { 
  return taken.some(t => isSameTile(t, tile)); // idk what this is... will go back to 
}

// FIRST SIX DAYS BEFORE GAMER TIME

function placePlayers(grid) {
  const taken = [];

  function randomTile() {
    return [
      randomInt(0, gridWidth - 1),
      randomInt(0, gridDepth - 1)
    ];
  }

  function placeTeam(team) {
    let count = 0;

    while (count < 3) {
      const tile = randomTile();

      if (!isTaken(taken, tile)) {
        const [x, z] = tile;

        grid[x][z].occupant = { // using object instead, adding these to the occupant
          team,
          hasRock: true
        };

        taken.push(tile);
        count++;
      }
    }
  }

  placeTeam("red");
  placeTeam("blue");
}


// API functions

export function initGame() {
  const grid = createEmptyGrid();
  generateHeights(grid);
  placePlayers(grid);

  return {
    grid,
    currentPlayer: "red",
    selected: null
  };
}


// Query functions: this is how the frontend can ask about the game state! this is very cool

export function getTile(game, x, z) {
  if (!game.grid[x] || !game.grid[x][z]) { // this is a function to save all the error checks
    // that i was having to do before
    return null;
  }
  return game.grid[x][z];
}

export function getCurrentPlayer(game) {
  return game.currentPlayer;
}

