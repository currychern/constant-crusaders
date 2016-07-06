'use strict'

var Q = require('q')
var robot = require('robotjs')

const X = 0, Y = 1, W = 0, H = 1

// Create the "class" wrapper
var Actions = {}

// Returns a promise. Clicks at the specified position.
Actions.clickDelay = (pos, time, num) => {
  let deferred = Q.defer()
  setTimeout(() => {
    let n
    (Number.isInteger(num)) ? n = num : n = 1
    robot.moveMouse(pos[X], pos[Y])
    for (var i = 0; i < n; i++) {
      robot.mouseClick()
    }
    return deferred.resolve(true)
  }, time)
  return deferred.promise
}

// Returns a promise. Clicks the button as specified.
Actions.clickButton = (pos, dim, time, num) => {
  let deferred = Q.defer()
  setTimeout(() => {
    let n
    (num) ? n = num : n = 1
    robot.moveMouse(pos[X] + dim[W] / 2, pos[Y] + dim[H] / 2)
    for (var i = 0; i < n; i++) {
      robot.mouseClick()
    }
    return deferred.resolve(true)
  }, time)
  return deferred.promise
}

// Export the module
module.exports = Actions

