# Constant Crusaders

![GameImage](https://raw.githubusercontent.com/currychern/constant-crusaders/master/assets/game.jpg)

> Crusaders of the Lost Idols automation. Run through an objective automatically.

**Note: I am not actively maintaining this app. Feel free to adapt the code to your own liking.**

Constant Crusaders has been tested on Windows and Ubuntu using Chrome, but should work in all environments. The app requires that the game, [Crusaders of the Lost Idols](http://www.kongregate.com/games/codename_enter/crusaders-of-the-lost-idols), be fully on screen without needing to scroll.

## Contents

- [Installation](#installation)
- [Features](#features)
- [Configuration](#configuration)
- [Limitations](#limitations)
- [Implementation](#implementation)
- [License](#license)

## Installation

1. Install `Node.js` on your computer.

2. Clone or download this project to your computer.

3. Run `npm install` within the project directory.

4. Open Crusaders of the Lost Idols and make sure an objective is selected or running.

5. Open the terminal and run `node app` within the project directory.

6. Help locate the upper left corner of the game. Follow the prompts or enter the position of the upper left corner in `config.json` if you already know it. **Note: the corner position has to be precise**

![CornerImage](https://raw.githubusercontent.com/currychern/constant-crusaders/master/assets/corner.jpg)

## Features

An objective is split up into four stages:

1. `Start` - Only the clicker character is on the map.
    The goal is to collect loot and kill monsters and get a non-clicker character on the map.

2. `Early` - A non-clicker character is now on the map.
    The goal is to collect loot, level and upgrade characters, and place them into formation.

3. `Middle` - All characters are now on the board.
    The goal is to collect loot and upgrade the main DPS character, while occasionally upgrading the other characters.

4. `End` - The characters have stalled.
    The goal is to kill monsters and rapidly upgrade the main DPS character.

The app will advance the game through all four stages based on information provided in the `config.json` file.

## Configuration

Use the `config.json` file to setup your game. Here are the descriptions for the fields:

- `pos_corner`: the position [x,y] of the upper left corner of the game

- `stage`: the stage that the app should start in ("START", "EARLY", "MIDDLE", "END")

- `area`: the area the objective is at when the app is started (1-n)

- `level_reset`: the area that the objective should be reset and the code should stop executing (1-n)

- `auto_reset`: specifies whether the app should automatically reset the objective

- `dps`: the slot that the DPS character is located in (1-20)

- `reset`: the slot that the character who can reset is in (1-20)

The delay fields correspond to the time delays associated with various actions. The game runs faster/slower on different machines. Changing the delay settings can make the app run smoother.

##### Example
I know the upper left corner of the game is at [21, 200]. I have already started the objective and am currently at area 107. I want to start at the "MIDDLE" stage and play until area 300. I do not want the app to automatically reset the objective once the characters pass area 300. My DPS character is Emo Werewolf and my reset character is Nate Dragon.

```JavaScript
{
  "pos_corner": [21, 200]
  "campaign": {
    "stage" : "MIDDLE",
    "area" : 107,
    "level_reset": 300,
    "auto_reset": false
  },
  "character": {
    "dps": 3,
    "reset" : 20
  }
}
```

## Limitations

There are a few limitations of the app in its current state:

- The app only scans slots (1-6) for characters to put on the map during the "START" stage. The app cannot advance to the "MIDDLE" stage if all characters in those slots are on missions or injured.

- The app finds the current area by scanning the area map for the yellow arrow. Unfortunately, this means the app might fail to find the area when the area map has yellow in the background.

- The app only stops after the characters have either stalled or wiped out, because that is the condition to advance from the "MIDDLE" to the "END" stage.

- The app does not select a new objective even if auto-reset is enabled, it only resets back to the page where you can select a new objective.

## Implementation

If you wish to tweak the code or add functionality, here is a brief synopsis of how some of the code is structured. The files not included here should be self explanatory.

- `game.json`: contains data about the location of important buttons, panels, and objects relative to the upper left corner of the game

- `Window.js`: contains window level methods, like how to find the corner of the game

- `Campaign.js`: contains objective level methods, like setting timers for actions according to the stage and figuring out what area the characters are in

- `Character.js`: contains character level methods, like how to level up characters, move the character panel left/right, and click the upgrade/level all buttons

- `Scanner.js`: abstraction layer that helps to read the screen

- `Helpers.js`: utility functions

## License

ISC License

Copyright (c) 2016, [Curry Chern](https://github.com/currychern)

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
