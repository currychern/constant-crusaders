'use strict'

var robot = require('robotjs')

var Config = require('./Config')
var Scanner = require('./Scanner')

const X = 0, Y = 1, W = 0, H = 1

var Window = {
  cornerColor: null,
  dim: null,
  reset: {
    pos_confirm: null,
    pos_button: null,
    pos_continue: null
  },

  cornerPos: null,
}

// Sets field parameters based on JSON data
Window.setInfo = (win) => {
  Window.cornerColor = win.color_corner
  Window.dim = [win.w, win.h]
  Window.reset.pos_confirm = [win.reset.confirm.x, win.reset.confirm.y]
  Window.reset.pos_button = [win.reset.button_press.x, win.reset.button_press.y]
  Window.reset.pos_continue = [win.reset.continue.x, win.reset.continue.y]

  if (Config.cornerPos) {
    Window.cornerPos = Config.cornerPos
  }
}

// Returns the position of the upper left corner of the game given by the user
Window.findCornerPos = () => {

  if (Window.cornerPos) {
    let pos = Window.cornerPos
    console.log('Position: ' + pos[X] + ', ' + pos[Y])
    return pos
  }

  console.log('Help find the upper left corner.')
  return Window.getBoundBox()
  .then((boxPos) => {
    console.log('Thanks!\n')
    console.log('Scanning...')
    return Scanner.findColorPos(boxPos[0], boxPos[1], Window.cornerColor)
  })
  .then((pos) => {
    if (!pos) {
      console.log('Error - Game is not fully onscreen')
      throw (new Error('Game is not fully onscreen'))
    }

    if (Scanner.isOutOfBounds([pos[X] + Window.dim[W], pos[Y] + Window.dim[H]])) {
      console.log('Error - Game is not fully onscreen')
      throw (new Error('Game is not fully onscreen'))
    }

    console.log('Position: ' + pos[X] + ', ' + pos[Y])
    Window.cornerPos = pos
    return pos
  })
}

// Returns the upper left and lower right corners of a box as given by the
// user. The user will first move the mouse to the upper left corner, then
// the lower right corner.
Window.getBoundBox = () => {
  var boundBox = []
  return Scanner.getPos('Bound box: upper left', 3000, true)
  .then((pos) => {
    boundBox.push(pos)
    return Scanner.getPos('Bound box: lower right', 3000, true)
  })
  .then((pos) => {
    boundBox.push(pos)
    return boundBox
  })
}

// Focuses the window given the position of the upper left corner and
// dimensions of the window
Window.focus = (pos, dim) => {
  robot.moveMouse(pos[X] + dim[W] / 2, pos[Y] + dim[H] / 2)
  robot.mouseClick()
}

// Export the module
module.exports = Window

