'use strict'

const X = 0, Y = 1

// Create the "class" wrapper
var Helpers = {}

Helpers.padify = (pos, pad) => {
  return [pos[X] + pad[X], pos[Y] + pad[Y]]
}

Helpers.addPos = (pos1, pos2) => {
  return [pos1[X] + pos2[X], pos1[Y] + pos2[Y]]
}

Helpers.floor5 = (num) => {
  return Math.floor(num / 5) * 5
}

Helpers.ceil5 = (num) => {
  return Math.ceil(num / 5) * 5
}

Helpers.clearIntervals = (timers) => {
  timers.forEach((timer) => {
    clearInterval(timer)
  })
}

Helpers.hexToGrayscale = (hex) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ?
    Math.round(
      0.299 * parseInt(result[1], 16) +
      0.587 * parseInt(result[2], 16) +
      0.114 * parseInt(result[3], 16)
    ) : null
}

Helpers.hexToRgb = (hex) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

Helpers.isYellow = (rgb) => {
  // R is greater than 210, R:G is between 1.0-1.5, G:B is above 2.0
  let rg = (rgb.r / rgb.g).toFixed(1)
  let gb = (rgb.g / rgb.b).toFixed(1)
  return (rgb.r > 210 && (1.0 < rg && rg < 1.5) && gb > 2.0)
}

// Export the module
module.exports = Helpers

