// game.js
/* 
issues with ideas in main:
- rendering logic is supposed to go on the other side. 
    for simplicity, this is just going to be game logic
- game must be a data structure for marks (?)
    though we've been told the front end is what we're judged on.
*/

// big change i need to keep in mind: "game" is now used to save the gamestate
// wheras before i had a bunch of different arrays! this was bad.


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
  return taken.some(t => isSameTile(t, tile)); // .some checks an array to see if *any*
  // elements pass the condition
  // this is an arrow function using t as an argument.
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

// Selection

export function selectTile(game, x, z) { // unlike my original, this returns a *new* game state
  const tile = getTile(game, x, z); // rather than overwriting the last one, better for debugging

  if (!tile || !tile.occupant) return game;

  if (tile.occupant.team !== game.currentPlayer) return game;

  return {
    ...game,
    selected: [x, z]
  };
}

// movement logic

// any character can move to an adjacent tile with a +1 to -2 height difference
// a character with no rock can move to an adjacent tile with a +3 to -2 height difference
// a character with a rock can drop the rock onto an adjacent tile:
// - that tile will now have a rock on it
// - that character will now have no rock
// - if that tile had a character on it, that character is now dead and removed from the game
// if a character moves to a tile with a rock on it, the character will pick up the rock

// functions for movement

function isAdjacent(a, b) { // two coordinates, will be each tile's [x, z]
  const dx = Math.abs(a[0] - b[0]); // are they adjacent in x/y?
  const dz = Math.abs(a[1] - b[1]); // if so, only one of dx or dy can be 1
  return dx + dz === 1; // if this was 2, they'd be diagonal.
}

function heightDiff(game, from, to) {
  const a = getTile(game, ...from); // "..." is spread syntax, allowing importation
  const b = getTile(game, ...to); // of the whole array, more reliable than manual indexing
  // this function finds the coordinates, safety checks them and returns the difference
  return b.height - a.height; // in the height property.
}