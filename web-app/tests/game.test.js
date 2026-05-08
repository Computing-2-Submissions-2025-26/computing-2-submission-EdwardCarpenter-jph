// tests

// functions to import
import { describe, it, expect } from "vitest";

import {
  initGame,
  selectTile
} from "../game.js";

// helper function: my game contains randomess, so this lets me control the game state
// without having tests unreliably pass or fail depending on randomness

function makeTestGame() {
  const game = initGame();

  // remove random players
  for (let x = 0; x < 12; x += 1) {
    for (let z = 0; z < 4; z += 1) {
      game.grid[x][z].occupant = null;
    }
  }

  // place red player
  game.grid[0][0].occupant = {
    team: "red",
    hasRock: true
  };

  // place blue player
  game.grid[1][0].occupant = {
    team: "blue",
    hasRock: true
  };

  return game;
}

// test test
describe("does two plus two equal four?", () => {
  it("no shimmy, sherlock!", () => {
    expect(2 + 2).toBe(4);
  });
});

// selection test
// "never trust a test you haven't seen fail" and all
// but the null one failed before fixing, which is good enough for me.

describe("Selection", () => {

  it("red is the current player. there is a red goon at 0,0. can the player select the goon?", () => {
    const game = makeTestGame();

    const newGame = selectTile(game, 0, 0);

    expect(newGame.selected).toEqual([0, 0]);
  });

  it("red is the current player. there is a blue goon at 1,0. will the player be prevented from selecting this goon?", () => {
    const game = makeTestGame();

    const newGame = selectTile(game, 1, 0);

    expect(newGame.selected).toBe(null); // should return null
  });

  it("red is the current player. there is no goon at 5,2. can the player not select this lack of goon?", () => {
    const game = makeTestGame();

    const newGame = selectTile(game, 5, 2);

    expect(newGame.selected).toBe(null);
  });

});

// 