// game.js

"use strict";

/**
 * game state module for the tile based game, does not contain rendering code
 *
 * @module game
 *
 */


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        set up grid with constants
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

// separated  into 2 bits, since the alternative was confusing later on
const gridWidth = 12;
const gridDepth = 4; //4


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        general helpers
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function randomInt(min, max) { // makes random into a more intuitive format
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isSameTile(a, b) {
    return a[0] === b[0] && a[1] === b[1];
}

function isTaken(taken, tile) { // .some checks an array to see if *any*
    // elements pass the condition
    // this is an arrow function using t as an argument.
    return taken.some((t) => isSameTile(t, tile));
}

function isAdjacent(a, b) {
    const adjDist = Math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2);

    return (adjDist <= 1.5);
}

/**
* Returns the grid from the game state, for use in rendering and tests.
*
* @param {object} game - The game state to get the grid from
* @returns {array} The grid from the game state
*/
export const getGrid = Object.freeze(function getGrid(game) {
    return game.grid;
});

/**
* Returns the winner of the game

* @param {object} game - the gamestate to check for a winner
* @returns {string|null} winner - the team that has won,
* or null if there is no winner
*/
export const getWinner = Object.freeze(function getWinner(game) {
    return game.winner;
});

/**
* returns whether the current player has only one goon left:
* this is used in selection logic that prevents a specific softlock
* where a single stuck player could never end their turn
* as well as allowing a losing player to end their turn on their own terms.
* (e.g. dropping their own rock on themselves to end the turn)

* @param {object} game - the gamestate to check
* @returns {boolean} true if the current player has 1 goon remaining
*/
const isLastGoon = Object.freeze(function isLastGoon(game) {
  const count = game.grid.flat().filter(
    (tile) =>
      isPlayer(tile.occupant) &&
      tile.occupant.team === game.currentPlayer
  ).length;

  return count <= 1;
}); // this function was rewritten by VSCode's built-in AI to resolve
// a linter error.

export { isLastGoon };

/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        tile specific helpers
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function createTile() {
    // create a blank tile with no height and null as the occupant
    return {
    height: 0,
    occupant: null // can become { team: "red"/"blue", hasRock: true/false }.
    // null is treated as "empty"
  };
}


// checks if the occupant type is player
// this is much more readable than the alternative
function isPlayer(occupant) {
    return occupant && occupant.type === "character";
}
function isRock(occupant) {
    return occupant && occupant.type === "rock";
}

function removeOccupant(tile) { // this is something suggested by chatgpt.
  tile.occupant = null; // allows for removing an occupant
  // without mutating the array
} // note: also removes rocks! don't forget that

function placeRock(tile) {
    tile.occupant = {
        type: "rock"
  };
}

function moveOccupant(fromTile, toTile) {
  toTile.occupant = fromTile.occupant;
  fromTile.occupant = null;
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        grid generation
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function createEmptyGrid() { // this function must be partially credited to
    // ChatGPT, more details in the AI disclosure.
    return Array.from({ length: gridWidth }, () =>
        Array.from({ length: gridDepth }, () => createTile())
);
}

function generateHeights(grid) {
    for (let x = 0; x < gridWidth; x += 1) {

        // first row
        grid[x][0].height = randomInt(0, 2);

        // rest of column
        for (let z = 1; z < gridDepth; z += 1) {

            const prevHeight = grid[x][z - 1].height;

            // ensure it doesn't go down (essential for visuals pass!)
            let newHeight = randomInt(prevHeight, prevHeight + 2);
            if (newHeight >= 8) {
                newHeight = 7;
            };
            grid[x][z].height = newHeight;
        }// NOTE: change from 2 depending on how square the output is!
    }
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        place players on grid
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

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

        while (count < 3) { // NOTE: THIS IS WHERE I WOULD CHANGE THE CHAR COUNT

            const tile = randomTile();

            if (!isTaken(taken, tile)) {

                const [x, z] = tile;

                grid[x][z].occupant = {team,type: "character",hasRock: true};
                taken.push(tile);

                count += 1;
            }
        }
    }

    placeTeam("red");
    placeTeam("blue");
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    initialise game (export functions)
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

/**
* Creates a new random grid as the playspace.
* - Each tile is given a height, on a slope
*   such that information is not concealed
* - initial positions of players are set randomly
*
* @returns {object} game - the initial gamestate
*/
export function initGame() {
    const grid = createEmptyGrid();

    generateHeights(grid);
    placePlayers(grid);

    return {grid,currentPlayer: "red",selected: null,winner: null};
}

/**
Returns the tile at the coordinates if it exists
* @param {object} game - the gamestate to get the tile from
* @param {number} x - the x coordinate of the tile
* @param {number} z - the z coordinate of the tile

* @returns {object|null} tile - the tile at the coordinates, or null if error
*/
export function getTile(game, x, z) {
    if (!game.grid[x] || !game.grid[x][z]) {
        return null;
    }
    return game.grid[x][z];
}

/**
* returns the current player from the gamestate for use in rendering and tests

* @param {object} game - the gamestate to get the current player from

* @returns {string} currentPlayer - the team of the current player
*/
export function getCurrentPlayer(game) {
    // returns the property controlling the current player
    return game.currentPlayer;
}

function heightDiff(game, from, to) {
// determine height difference
    const a = getTile(game, ...from);
    const b = getTile(game, ...to);

    if ((a === null) || (b === null)) {
        //console.log("Error: tile in heightDiff could not be obtained")
        return(0);
    };

    return b.height - a.height;
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    selection
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

/**
* Selects a tile if it contains a character of the current player's team
* Or deselects the tile if it is already selected, unless it is the
* current player's last remaining goon, to preserve their ability to
* self-eliminate instead of softlocking
* Otherwise, the game state is returned with no changes

* @param {object} game - the gamestate to select the tile on
* @param {number} x - the x coordinate of the tile to select
* @param {number} z - the z coordinate of the tile to select
*
* @returns {object} game - the gamestate with the selected tile,
* or unchanged if selection was invalid
*/
export function selectTile(game, x, z) {
  if (game.selected && isSameTile(game.selected, [x, z]) && !isLastGoon(game)) {
    return { ...game, selected: null };
  }

  const tile = getTile(game, x, z);
  if (!tile || !tile.occupant) {return game;}
  if (!isPlayer(tile.occupant)) {return game;}
  if (tile.occupant.team !== game.currentPlayer) {return game;}

  return {...game, selected: [x, z]};
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    movement validation
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function cannotWalkTo(game, target) {

    if (!game.selected) {
        //console.log("Error! no tile selected.");
        return true;};

    if (!isAdjacent(game.selected, target)) {
        return true;}

    const fromTile = getTile(game, ...game.selected);
    const targetTile = getTile(game, ...target);

    if (!targetTile) {
        return true;};

    const mover = fromTile.occupant;
    const targetOccupant = targetTile.occupant;

    // cannot move onto another character
    if (isPlayer(targetOccupant)) {
        return true;}

    // cannot move onto a rock if already holding one
    if (isRock(targetOccupant) && mover.hasRock) {
        return true;};

  const diff = heightDiff(game, game.selected, target);

  // cannot move down more than 2
  if (diff < -2) {return true;}

  // climb restrictions
    if (mover.hasRock) {

        if (diff > 1) {return true;}
    } else {

        if (diff > 3) {return true;};
    }
    return false;
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    rock drop validation
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function cannotDropRockTo(game, target) {

    if (!game.selected) {return true;};
    if (!isAdjacent(game.selected, target)) {return true;}

    const fromTile = getTile(game, ...game.selected);
    const targetTile = getTile(game, ...target);

    if (!targetTile) {return true;}

    const mover = fromTile.occupant;

    // must actually have rock
    if (!mover.hasRock) {return true;}

    const diff = heightDiff(game, game.selected, target);
    const targetOccupant = targetTile.occupant;

    // splatting another character
    if (isPlayer(targetOccupant)) {
        // must be same height or higher
        return diff > 0;}

    // dropping rock downward
    return diff >= -2;
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    rock drop validation
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function cloneGame(game) { // function was completely replaced by chatgpt
    return {
        ...game,

        grid: game.grid.map(column =>
            column.map(tile => ({
                ...tile,

                occupant: tile.occupant
                    ? {...tile.occupant}
                    : null
            }))
        )
    };
}

// this function came from Claude, Sonnet 4.6, and must be credited
function withTile(grid, x, z, changes) {
  return grid.map((column, cx) =>
    cx === x
      ? column.map((tile, cz) => (cz === z ? { ...tile, ...changes } : tile))
      : column
  );
}

function endTurn(game) {

    const nextTeam =
        game.currentPlayer === "red"
            ? "blue"
            : "red";

    return {...game,selected: null,currentPlayer: nextTeam};
}

function checkWinner(game) {
    const allTiles = game.grid.flat();
    const redAlive = allTiles.some(tile =>
        isPlayer(tile.occupant) && tile.occupant.team === "red");
    const blueAlive = allTiles.some(tile =>
        isPlayer(tile.occupant) && tile.occupant.team === "blue");

    if (!redAlive) return "blue";
    if (!blueAlive) return "red";

    return null;
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
            Actions
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function actionMove(game, target) {
    // there is a from tile and a target tile
    const newGame = cloneGame(game);

    const fromTile = getTile(newGame, ...newGame.selected); //the from tile
    // must be the selected tile
    const targetTile = getTile(newGame, ...target); // the to tile / target tile
    // must be the other tile

    const mover = fromTile.occupant;

    // pick up rock if there are rocks to be picked
    if (isRock(targetTile.occupant)) {
        mover.hasRock = true; // NOTE TO SELF: this is fine, because if
        // mover already has a rock they can't move here!
    }

    moveOccupant(fromTile, targetTile);
    return endTurn(newGame);
}

function actionDropRock(game, target) {

    const newGame = cloneGame(game);

    const fromTile = getTile(newGame, ...newGame.selected);
    const targetTile = getTile(newGame, ...target);

    const mover = fromTile.occupant;

    mover.hasRock = false;

    if (isPlayer(targetTile.occupant)) {
        //console.log("Splat!,wav");
    } else {
        //console.log("Clang!.wav");
    }

    placeRock(targetTile);
    return endTurn(newGame);
}

function actionSelfSplat(game, target) {
    // if this is annoying me i will simply remove it
    // likely to be buggy for no reason.
    const newGame = cloneGame(game);

    const fromTile = getTile(newGame, ...newGame.selected);
    const targetTile = getTile(newGame, ...target);

    // if another character is below, splat them too
    if (targetTile.occupant) {
        // splat other character and they break your fall
        removeOccupant(targetTile)
        moveOccupant(fromTile,targetTile);
    } else {
        removeOccupant(fromTile);
    }

  //console.log("Self splat! cue Splat sound effect again");

  return endTurn(newGame);
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
            Actions RESOLVER
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/
/**
* Resolves an attempted action depending on it's context;
* different actions map to different moves depending on the nature of the target
*
* @param {object} game - the gamestate to perform the action on
* @param {array} target - the coordinates of the tile to perform the action on
*
* @returns {object} game - the new gamestate after the action is performed,
* or unchanged if the action was invalid
*/
export function performAction(game, target) {
  // no selected tile
    if (!game.selected) {
        //console.log(game)
        return game;}

    const fromTile = getTile(game, ...game.selected);

    if (!fromTile || !isPlayer(fromTile.occupant)) {
        //console.log(game)
        return game;}

    const mover = fromTile.occupant;
    const diff = heightDiff(game, game.selected, target);

    // WALK

    if (!cannotWalkTo(game, target)) {
        const result = actionMove(game, target);
        const winner = checkWinner(result);

        if (winner) {result.winner = winner;}
    //console.log(result)
    return result;}

    // DROP ROCK

    if (!cannotDropRockTo(game, target)) {
        const result = actionDropRock(game, target);
        const winner = checkWinner(result);

        if (winner) {result.winner = winner;}
    //console.log(result)
    return result;}

  // DROP, WITH NOTHING (CHEESE WITH NOTHING?)

    if (!mover.hasRock && diff < -2) { // exception case to not being able
        // to move or drop rock

        const result = actionSelfSplat(game, target);
        const winner = checkWinner(result);

        if (winner) {
            result.winner = winner;}

        //console.log(result)
        return result;}

  // invalid action
  //console.log(game)
  //console.log("Invalid Action Attempted")
  return game;
}

// (this function is a modified version of some Claude code,
// and iis credited in the ai disclosure.)
/**
* returns coordinates the current selection could legally act on
* (walk, drop rock, or self-splat) — for rendering hints only
*
* @param {object} game - the gamestate to check
* @returns {array} targets - array of [x, z] pairs
*/
export function getValidTargets(game) {
  if (!game.selected) {return [];}

  const mover = getTile(game, ...game.selected).occupant;
  const targets = [];

  for (let x = 0; x < gridWidth; x += 1) {
    for (let z = 0; z < gridDepth; z += 1) {
      if (isSameTile([x, z], game.selected)) {continue;}

      const diff = heightDiff(game, game.selected, [x, z]);
      const validSelfSplat =
        !mover.hasRock && diff < -2 && isAdjacent(game.selected, [x, z]);

      if (
        !cannotWalkTo(game, [x, z]) ||
        !cannotDropRockTo(game, [x, z]) ||
        validSelfSplat
      ) {
        targets.push([x, z]);
      }
    }
  }
  return targets;
}