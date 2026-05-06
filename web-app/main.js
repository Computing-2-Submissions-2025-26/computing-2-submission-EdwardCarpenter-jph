import R from "./ramda.js";

/*
gamespace represented by 8x16 css grid of tiles, shaped in a 2 to 1 aspect ratio. Tiles may be:

block top with nothing on
block top with a red player with a rock on
block top with a blue player with a rock on
block top with a red player on
block top with a blue player on
block top with just a rock on

block side below a block top but not above one
block side above a block top but not below one
block side both above and below a top
block side neither above nor below a top

sky tile

An array of heights and (string) states for an 12 x 4 (?) grid will be created randomly, assigning heights such that nothing will be covered later and assigning 3 tiles to each team to have a player on at the start

this array will be used to create the visual array, starting by defining the points that will be tops then using this data to fill in the rest of the grid with side types.*/

// function to generate the random play space

const gridsize = [12, 4]

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function worldHeightGen() {
    // initialise 12 x 4 array of empty tiles (gridsize dependant)
    let emptyWorld = []
    
    let emptyDepth = []
    for (let i = 0; i < gridsize[1]; i += 1) {
        emptyDepth.push([]);}
    for (let j = 0; j < gridsize[0]; j += 1) {
        emptyWorld.push(emptyDepth);}
    
    // need to fill a 12 x 4 array such that no column has a height lesser than the one behind it
    // fill the first row with heights between 0 and 2
    for (let rowOneColumn = 0; rowOneColumn < gridsize[0]; rowOneColumn += 1) {
        emptyWorld[rowOneColumn][0] = Math.floor(Math.random() * (gridsize[0]/gridsize[1]));}
    
        // fill the rest of the rows, going col by col
    for (let row = 1; row < gridsize[1]; row += 1) { //starts at 1 because row 0 is already filled
        for (let column = 0; column < gridsize[0]; column += 1) {
            // set the position to a value between 0 and 3 (the step allowable that predicts reaching the top on average) higher than the one before it
            emptyWorld[column][row] = randomInt(emptyWorld[column][row-1], (emptyWorld[column][row-1] + gridsize[0]/gridsize[1]));        
        }
    // note: possible issue, may need to rebalance random height depending.
    } 

    return emptyWorld;

}

function worldStateGen() {
    // initialise array of size gridsize, filled with "empty" strings
    let emptyWorld = []
    
    let emptyDepth = []
    for (let i = 0; i < gridsize[1]; i += 1) {
        emptyDepth.push(["empty"]);}
    for (let j = 0; j < gridsize[0]; j += 1) {
        emptyWorld.push(emptyDepth);}

    let takenTiles = []
    let RedTilesChosen = []
    let BlueTilesChosen = []
    let randomTile = [0, 0]

    // assigns 3 tiles to each team without overlapping
    while (RedTilesChosen.length < 3) {
        randomTile = [randomInt(0, gridsize[0]-1), randomInt(0, gridsize[1]-1)]
        if (RedTilesChosen.includes(randomTile) || BlueTilesChosen.includes(randomTile)) {
            continue;
        } else {
            RedTilesChosen.push(randomTile);
        }}
    // same for blue
    while (BlueTilesChosen.length < 3) {
        randomTile = [randomInt(0, gridsize[0]-1), randomInt(0, gridsize[1]-1)]
        if (RedTilesChosen.includes(randomTile) || BlueTilesChosen.includes(randomTile)) {
            continue;
        } else {
            BlueTilesChosen.push(randomTile);
        }}
    
    // fills the empty world with the player positions
    for (let i = 0; i < RedTilesChosen.length; i += 1) {
        emptyWorld[RedTilesChosen[i][0]][RedTilesChosen[i][1]] = "RedRock";
    }
    for (let i = 0; i < BlueTilesChosen.length; i += 1) {
        emptyWorld[BlueTilesChosen[i][0]][BlueTilesChosen[i][1]] = "BlueRock";
    }

    return emptyWorld;
}


let worldHeight = worldHeightGen();
let worldState = worldStateGen();

console.log(worldHeight);
console.log(worldState);

// function to create the visual array from the height and state arrays, using the height array to determine the tile type and the state array to determine the player positions
/* i'll place the tops first, these can be:

- empty
- red player with rock
- blue player with rock
- red player no rock
- blue player no rock
- just a rock

then i'll fill in the sides, since these are dependant on top location not in-theory 3d space.*/

function initializeVisualArray() {
    // visualArray size is (width of gridsize) x (2 x width of gridsize)
    // this is because the final height should be about the same as the width
    // and each tile will he half as tall as it is wide
    // hence the doubled height
    
    visGridSize = [gridsize[0], gridsize[0]*2]

    let visualArray = []
    // initialise empty visual array?
    // should be of size visGridSize, filled with "unassigned" strings
    // *not* "empty" strings, as empty is a valid tile type
    
    let visualY= []
    for (let i = 0; i < visGridSize[1]; i += 1) {
        visualY.push("unassigned");}
    for (let j = 0; j < visGridSize[0]; j += 1) {
        visualArray.push(visualY);}
    
    // fill in the tops
    // note: this might be upside down? this is an issue to fix later, maybe even on the html end

    for (let row = 0; row < gridsize[1]; row += 1) {
        for (let column = 0; column < gridsize[0]; column += 1) {
            // read through each column, shifting it up to a later row depending on its height
            height = worldHeight[column][row]
            visualArray[column][row + height] = worldState[column][row]

    // fill in the gaps with the approriate side
    /*this will be
    "under" if its below a top but not above one
    "over" if its above a top but not below one
    "step" if its both above and below a top
    "trans" if its neither above nor below a top
    "error" if it's unassigned. this is for debug, i suspect this will draw from out of range.
    */

    // multiple things could be the top of a column
    // so i need to check for them
    const topTypes = ["RedRock", "BlueRock", "RedPlayer", "BluePlayer", "Rock", "empty"]

    for (let row = 0; row < visGridSize[1]; row += 1) {
        for (let column = 0; column < visGridSize[0]; column += 1) {
            // check if the tile is still unassigned
            if (visualArray[column][row] === "unassigned") {
                // check for tops above and below
                if (topTypes.includes(visualArray[column][row-1]) && topTypes.includes(visualArray[column][row+1])) {
                    visualArray[column][row] = "step";
                } else if (topTypes.includes(visualArray[column][row-1]) {
                    visualArray[column][row] = "under";
                } else if (topTypes.includes(visualArray[column][row+1]) {
                    visualArray[column][row] = "over";
                } // check for unassigned to make sure!
                else if (!topTypes.includes(visualArray[column][row-1]) && !topTypes.includes(visualArray[column][row+1])) {
                    visualArray[column][row] = "trans";
                } else if ((visualArray[column][row-1]) === "unassigned" && (visualArray[column][row+1]) === "unassigned" ) {
                    visualArray[column][row] = "error";
                } else {
                    visualArray[column][row] = "error";
            }
            
        

    }