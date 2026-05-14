// game.js

/*
issues with ideas in main:
- rendering logic is supposed to go on the other side.
    for simplicity, this is just going to be game logic
- game must be a data structure for marks (?)
    though we've been told the front end is what we're judged on.
*/

// big change i need to keep in mind:
// "game" is now used to save the gamestate
// whereas before i had a bunch of different arrays! this was bad.


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        set up grid with constants
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

// separated  into 2 bits, since the alternative was confusing later on
const gridWidth = 12;
const gridDepth = 4;


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        general helpers
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function randomInt(min, max) { // makes random into a more intuitive format
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isSameTile(a, b) { // can't just do array === array because javascript is cringe
    return a[0] === b[0] && a[1] === b[1];
}

function isTaken(taken, tile) { // .some checks an array to see if *any*
    // elements pass the condition
    // this is an arrow function using t as an argument.
    return taken.some(t => isSameTile(t, tile));
}

function isAdjacent(a, b) {
    // checks on x and z. could expand this bit later, note to self
    //const isAdjacent = false;
    
    //const dx = Math.abs(a[0] - b[0]); // adjacent on x
    //const dz = Math.abs(a[1] - b[1]); // adjacent on y

    //isAdjacent = dx + dz === 1

    // want to add diagonals:
    // in a diagonal or adjacent tile but *not* in a non-adjacent tile the distance will be less than root 2
    // which i can make 1.5 since the issue threshold is higher.

    const adjDist = Math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2);

    return (adjDist <= 2);
}

/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        export helpers
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

export function getGrid(game) {
    return game.grid;
}

export function getWinner(game) {
    return game.winner;
}

/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        tile specific helpers
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function createTile() {
    // create a blank tile with no height and null as the occupant
    return {
    height: 0,
    occupant: null // may later become { team: "red"/"blue", hasRock: true/false }. null is treated as "empty"
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
  tile.occupant = null; // allows for removing an occupant without mutating the array
} // note: also removes rocks! don't forget that

function placeRock(tile) {
    tile.occupant = {
        type: "rock"
  };
}

function moveOccupant(fromTile, toTile) { // this is another ai addition
  toTile.occupant = fromTile.occupant;
  fromTile.occupant = null;
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        grid generation
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function createEmptyGrid() { // this function mistakenly wasn't labelled as ai originally but it is
    return Array.from({ length: gridWidth }, () => // i wrote a version of this before, but this does it in less space
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
            let newHeight = randomInt(prevHeight, prevHeight + 2);// floor at prev, goes up to 2
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

export function initGame() {
    const grid = createEmptyGrid();

    generateHeights(grid);
    placePlayers(grid);

    return {grid,currentPlayer: "red",selected: null,winner: null};
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    query functions for higher lv
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

export function getTile(game, x, z) {

    if (!game.grid[x] || !game.grid[x][z]) { // inbuilt error catcher! makes sure the tile exists.
        return null;
    }
    return game.grid[x][z];
}

export function getCurrentPlayer(game) {
    return game.currentPlayer; // returns the property controlling the current player
}

function heightDiff(game, from, to) {
// determine height difference
    const a = getTile(game, ...from); // remember ... lets me get both coordinates
    const b = getTile(game, ...to);

    if ((a === null) || (b === null)) {
        console.log("Error: tile in heightDiff could not be obtained")
        return(0);
    };

    return b.height - a.height;
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    selection
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

export function selectTile(game, x, z) {
    // function makes sure the selection is an existing player 

    const tile = getTile(game, x, z);

    if (!tile || !tile.occupant) {return game;}
    if (!isPlayer(tile.occupant)) {return game;}
    if (tile.occupant.team !== game.currentPlayer) {return game;}

    return {...game,selected: [x, z]};
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    movement validation
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

// if selected character has a rock:
// - can climb +1
// - can descend -2 EDIT: now given to the rock drop function
//
// if selected character has no rock:
// - can climb +3
// - can descend -2

function cannotWalkTo(game, target) {

    if (!game.selected) {
        console.log("Error! no tile selected.");
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
    return diff >= -2; // 
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    rock drop validation
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function cloneGame(game) { // this function has been completely replaced by chatgpt
    return { // advice against mutating the grid was originally also reccomended by an LLM
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

function endTurn(game) {

    const nextTeam =
        game.currentPlayer === "red"
            ? "blue"
            : "red";

    return {...game,selected: null,currentPlayer: nextTeam};
}

function checkWinner(game) {
    let redAlive = false;
    let blueAlive = false;

    for (let x = 0; x < gridWidth; x++) { // check through the grid for living red or blue characters

        for (let z = 0; z < gridDepth; z++) {

            const occ = game.grid[x][z].occupant;

            if (isPlayer(occ)) {
                if (occ.team === "red") {redAlive = true;}
                if (occ.team === "blue") {blueAlive = true;}}
            }
        }

    if (!redAlive) {return "blue";}
    if (!blueAlive) {return "red";}

  return null;
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
            Actions
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

function actionMove(game, target) {
    // there is a from tile and a target tile
    const newGame = cloneGame(game);

    const fromTile = getTile(newGame, ...newGame.selected); //the from tile must be the selected tile
    const targetTile = getTile(newGame, ...target); // the to tile / target tile must be the other tile

    const mover = fromTile.occupant;

    // pick up rock if there are rocks to be picked
    if (isRock(targetTile.occupant)) {
        mover.hasRock = true; // NOTE TO SELF: this is fine, because if mover already has a rock they can't move here!
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
        console.log("Splat! this is where a splat sound might play if i have time to work that out");
    } else {
        console.log("Clang! this is where a splat sound might play if i have time to work that out");
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
    if (targetTile.occupant) {removeOccupant(targetTile);}

  removeOccupant(fromTile);

  console.log("Self splat! cue Splat sound effect again");

  return endTurn(newGame);
}


/*XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
            Actions RESOLVER
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX*/

export function performAction(game, target) {

  // no selected tile
    if (!game.selected) {
        console.log(game)
        return game;}

    const fromTile = getTile(game, ...game.selected);

    if (!fromTile || !isPlayer(fromTile.occupant)) {
        console.log(game)
        return game;}

    const mover = fromTile.occupant;
    const diff = heightDiff(game, game.selected, target);

    // WALK

    if (!cannotWalkTo(game, target)) {
        const result = actionMove(game, target);
        const winner = checkWinner(result);

        if (winner) {result.winner = winner;}
    console.log(result)
    return result;}

    // DROP ROCK

    if (!cannotDropRockTo(game, target)) {
        const result = actionDropRock(game, target);
        const winner = checkWinner(result);

        if (winner) {result.winner = winner;}
    console.log(result)
    return result;}

  // DROP, NO ROCK

    if (!mover.hasRock && diff < -2) { // exception case to not being able to move or drop rock

        const result = actionSelfSplat(game, target);
        const winner = checkWinner(result);

        if (winner) {
            result.winner = winner;}

        console.log(result)
        return result;}

  // invalid action
  console.log(game)
  console.log("Invalid Action Attempted")
  return game;
}