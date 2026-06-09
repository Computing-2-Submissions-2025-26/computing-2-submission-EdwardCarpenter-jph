# README - DOWNTOWN GOONS

A turn-based game based around dropping 10 ton weights on rival gangsters. Details on how to play are included in the web app itself.

### Notes for Peer Reviewer

- I am having trouble setting up the correct version of JSLint, so i'd appreviate an overview of how well this passes lint. 
- My JSDoc is incomplete and unclear in areas: advice on this is also helpful.
- There is one Axe Devtools error i have temporarily put off fixing, since the obvious ways of doing so cause other issues. I am unsure if this error is actually impactful enough to be a problem.

### Installation

The files in this project include: 

* **default.css**
* **index.html**
* **main.js**, which takes functions from game.js and renders a front end arrangement in a grid to be displayed
* **game.js**, in which game logic is stored
* **game.test.js**, which contains several tests to ensure game logic in game.js is not breaking
* various art assets and fonts in **assets**



The way this setup has been tested is with Firefox Developer Edition: with **ctrl+o,** **index.html** is selected to be viewed.



### Credits:

Credits have been omitted in this version, since peer review should be anonymous.


##### AI Disclosure (Mirrored on webpage):

Limited and judicious use has been made of AI models in developing this web app:



**OpenAI's GPT-5.5** was used to: debug code, re/write limited sections of code in game.js (signposted in comments: cloneGame), rapidly iterate through possibilities for depth cues in the rendering system in main.js. A test in game.test.js, "Invalid Actions", was also AI suggested and generated. I also had ChatGPT explain how to do certain things in CSS and HTML: many inclusions in.tile and .tile-sprite in default.css were suggested by this model. Aria label functionality was implemented with this model as well.

**Google's Gemini Flash** was also used to rewrite limited sections of code in main and game.js (signposted in comments: createEmptyGrid) as well as check default.css for best practice.

