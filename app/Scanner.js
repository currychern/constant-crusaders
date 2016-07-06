'use strict'

var Q = require('q')
var robot = require('robotjs')

var Helpers = require('./Helpers')

const X = 0, Y = 1

//Cache screen size
var screenSize = robot.getScreenSize()

// Create the "class" wrapper
var Scanner = {}

// Returns a promise containing the position of the mouse
Scanner.getPos = (message, time, printPos) => {
  if (message)
    console.log(message)
  let deferred = Q.defer()
  setTimeout(() => {
    let mouse = robot.getMousePos()
    if (printPos)
      console.log('Position: ' + mouse.x + ', ' + mouse.y)
    return deferred.resolve([mouse.x, mouse.y])
  }, time)
  return deferred.promise
}

// Returns a boolean indicating if the color at the position matches what is
// expected
Scanner.colorMatch = (pos, matchColor) => {
  let color = robot.getPixelColor(pos[X], pos[Y])
  return (color.toString() === matchColor)
}

// Returns the average greyscale bitmap color (int)
Scanner.avgBitmapColor = (bitmap) => {
  var color = 0
  for (var i = 0; i < bitmap.width; i++) {
    for (var j = 0; j < bitmap.height; j++) {
      color += Helpers.hexToGrayscale(bitmap.colorAt(i, j))
    }
  }
  return Math.round(color / (bitmap.width * bitmap.height))
}

// Returns the position of the nth yellow pixel in the same column
Scanner.nthYellowInColumnPos = (bitmap, num, inc) => {
  for (var i = 0; i < bitmap.width; i += inc) {
    let n = 0
    for (var j = 0; j < bitmap.height; j += inc ) {
      let rgb = Helpers.hexToRgb(bitmap.colorAt(i,j))
      if (Helpers.isYellow(rgb)) {
        n++
        if (n === num)
          return [i,j]
      }
    }
  }
  return null
}


// Returns the position where the given color is found given a starting range
// to search in, returns null if the color is not found. Scans left-right, top-
// bottom
Scanner.findColorPos = (posMin, posMax, color) => {
  for (var y = posMin[Y]; y < posMax[Y]; y++) {
    for (var x = posMin[X]; x < posMax[X]; x++) {
      if (Scanner.colorMatch([x,y], color))
        return [x,y]
    }
  }
  return null
}

// Check if the given position is outside the screen
Scanner.isOutOfBounds = (pos) => {
  if (pos[X] < 0 || pos[Y] < 0 ||
      pos[X] >= screenSize.width || pos[Y] >= screenSize.height)
    return true

  return false
}

// Export the module
module.exports = Scanner

