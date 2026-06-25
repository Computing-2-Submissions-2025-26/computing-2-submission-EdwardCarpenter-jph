# README - DOWNTOWN GOONS

A turn-based game based around dropping 10 ton weights on rival gangsters. Details on how to play are included in the web app itself.

### Note for Examiner

This web-app functions fully on my laptop, and my peer reviewer also had no issues viewing the game-board when playtesting; however, when testing with a third device I could not see the gameboard in the web-app.

It seems likely to me that this is due to an issue with how I was opening the app, rather than with the web-app itself, and this may not be a problem on your end. However, as a backup I have attatched an mp4 screen recording demonstrating the functioning webpage:

https://file.garden/adL34C2aS3ylDLdd/Imperial%20Transfers/DownTown%20-%20Gameplay%20Demonstration.mp4

If small extra steps are permissable, I've found three ways that allow me to reliably open the submission in the circumstances where just ctrl+o won't allow it:
- If a **"Live Server"** extension is installed, left clicking index.html and clicking **"Open with Live Server"** opens the page without issue
- **"npx serve ."** and **"python -m http.server"** run in the /web-app folder both produced a functional URL


### Installation

The files in this project include: 

* **default.css**
* **index.html**
* **main.js**, which takes functions from game.js and renders a front end arrangement in a grid to be displayed
* **game.js**, in which game logic is stored
* **game.test.js**, which contains several tests to ensure game logic in game.js is not breaking
* various art assets and fonts in **assets**

The way this setup has been tested is with Firefox Developer Edition: with **ctrl+o,** **index.html** it is selected to be viewed. 

### Credits:

Edward Carpenter


##### AI Disclosure (Mirrored on webpage):

Limited and judicious use has been made of AI models in developing this web app:

**OpenAI's GPT-5.5** was used to: debug code, re/write limited sections of code in game.js (signposted in comments: cloneGame), rapidly iterate through possibilities for depth cues in the rendering system in main.js. A test in game.test.js, "Invalid Actions", was also AI suggested and generated. I also had ChatGPT explain how to do certain things in CSS and HTML: many inclusions in.tile and .tile-sprite in default.css were suggested by this model. Aria label functionality was implemented with this model as well.

**Google's Gemini Flash** was also used to rewrite limited sections of code in main and game.js (signposted in comments: createEmptyGrid) as well as check default.css for best practice.

Towards the end of the development process, **Claude's Sonnet 4.6** was used in making sure the web-app worked across devices and browsers.


