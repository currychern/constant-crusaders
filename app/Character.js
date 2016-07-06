'use strict'

var _ = require('lodash')
var robot = require('robotjs')

var Actions = require('./Actions')
var Config = require('./Config')
var Helpers = require('./Helpers')
var Scanner = require('./Scanner')
var Window = require('./Window')

const X = 0, Y = 1, W = 0, H = 1

// Create the "class" wrapper
var Character = {
  pos: null,
  dim: null,
  activeColor: null,

  picture: {
    pos: null,
    dim: null,
    borderColor: null
  },
  levelButton: {
    pos: null,
    dim: null,
    colorArr: null
  },
  upgradeButton: {
    pos: null,
    dim: null,
    dist: null,
    resetColor: null
  },
  panel: {
    shift: 0,
    leftPos: null,
    rightPos: null,
    colorArr: null
  },
  all: {
    upgradePos: null,
    levelPos: null
  }
}

// Sets field parameters based on JSON data
Character.setInfo = (char) => {
  Character.pos = [char.x, char.y]
  Character.dim = [char.w, char.h]
  Character.activeColor = char.color_active

  let pic = char.picture
  Character.picture.pos = [pic.x, pic.y]
  Character.picture.dim = [pic.w, pic.h]
  Character.picture.borderColor = pic.color_border

  let level = char.button_level
  Character.levelButton.pos = [level.x, level.y]
  Character.levelButton.dim = [level.w, level.h]
  Character.levelButton.colorArr = [level.color_active, level.color_inactive]

  let upgrade = char.button_upgrade
  Character.upgradeButton.pos = [upgrade.x, upgrade.y]
  Character.upgradeButton.dim = [upgrade.w, upgrade.h]
  Character.upgradeButton.dist = upgrade.dist
  Character.upgradeButton.resetColor = [upgrade.color_reset.min, upgrade.color_reset.max]

  let panel = char.buttons_panel
  Character.panel.leftPos = [panel.left.x, panel.left.y]
  Character.panel.rightPos = [panel.right.x, panel.right.y]
  Character.panel.colorArr = [panel.color_active, panel.color_inactive]

  let all = char.buttons_all
  Character.all.upgradePos = [all.upgrade_all.x, all.upgrade_all.y]
  Character.all.levelPos = [all.level_all.x, all.level_all.y]
}



/*Gets*************************************************************************/

// Gets the position where the character panel starts based on slot
Character.getPos = (slot) => {
  let pos = [Character.pos[X], Character.pos[Y]]
  pos = Character.translatePos(pos, slot)
  return Helpers.padify(pos, Window.cornerPos)
}

// Gets the position of the upgrade button based on slot and upgrade number
Character.getUpgradePos = (slot, upgNum) => {
  let pos = [
    Character.upgradeButton.pos[X] + (upgNum - 1) * Character.upgradeButton.dist,
    Character.upgradeButton.pos[Y]]
  pos = Character.translatePos(pos, slot)
  return Helpers.padify(pos, Window.cornerPos)
}

// Gets the position of the level button based on slot
Character.getLevelPos = (slot) => {
  let pos = [Character.levelButton.pos[X], Character.levelButton.pos[Y]]
  pos = Character.translatePos(pos, slot)
  return Helpers.padify(pos, Window.cornerPos)
}

// Gets translated character position based on slot
Character.translatePos = (pos, slot) => {
  let index
  if (slot > 18)
    index = (slot + 3) % 6
  else {
    index = (slot - 1) % 6
  }

  // Add x and y shift based on slot evaluated
  let xShift = Math.floor(index / 2) * Character.dim[W]
  let yShift = (index % 2 == 1) ? Character.dim[H] : 0

  return [pos[X] + xShift, pos[Y] + yShift]
}

// Returns all slots (1-6) where the character color matches
Character.getActive = () => {
  let colorMatch = []

  for (var i = 1; i <= 6; i++) {
    let pos = Character.getPos(i)
    if (Scanner.colorMatch(pos, Character.activeColor)) {
      colorMatch.push(i)
    }
  }

  return colorMatch
}



/*Booleans*********************************************************************/

// Returns a boolean to see if the reset button is lit given the slot and the pos
Character.canReset = (slot, checkUpgrades) => {
  for (var i = 0; i < checkUpgrades.length; i++) {
    let pos = Character.getUpgradePos(slot, checkUpgrades[i])
    let bmp =  robot.screen.capture(pos[X], pos[Y], Character.upgradeButton.dim[W], Character.upgradeButton.dim[H])
    if (Scanner.avgBitmapColor(bmp) >= Character.upgradeButton.resetColor[0] &&
        Scanner.avgBitmapColor(bmp) <= Character.upgradeButton.resetColor[1])
      return [true, pos]
  }
  return [false, '']
}

// Returns a boolean to see if the level button is active
Character.canLevel = (slot, checkUpgrades) => {
  let pos = Character.getLevelPos(slot)
  return Scanner.colorMatch(pos, Character.levelButton.colorArr[0])
}



/*Actions**********************************************************************/

// Returns a promise and clicks the panel left-right buttons as specified
Character.panelClick = (dir, time, num) => {
  let pos
  switch (dir) {
    case 'LEFT':
      pos = Character.panel.leftPos
      Character.panel.shift -= num
      break
    case 'RIGHT':
      pos = Character.panel.rightPos
      Character.panel.shift += num
      break
  }

  pos = Helpers.padify(pos, Window.cornerPos)
  return Actions.clickDelay(pos, time, num)
}

// Shifts the panel so the character in the specified slot is onscreen
Character.shiftPanel = (slot) => {
  let shift = Math.min(Math.floor((slot - 1) / 6) * 3, 7)

  // Reset panel first 20% of the time
  if (Math.random() < 0.20) {
    return Character.resetPanel()
    .then(() => {
      Character.panelClick('RIGHT', Config.delay.short, shift)
    })
  }

  let diff = shift - Character.panel.shift

  if (diff >= 0)
    return Character.panelClick('RIGHT', Config.delay.short, diff)
  else
    return Character.panelClick('LEFT', Config.delay.short, -diff)
}

// Shifts the panel so the character in the specified slot is onscreen
Character.resetPanel = () => {
  return Character.panelClick('LEFT', Config.delay.short, Character.panel.shift)
}

// Clicks the character level button as specified
Character.levelButtonClick = (slot) => {
  Character.shiftPanel(slot)
  .then(() => {
    robot.keyToggle('control', 'down')
    let pos = Character.getLevelPos(slot)
    return Actions.clickButton(pos, Character.levelButton.dim, Config.delay.short_b, 1)
  })
  .then(() => {
    robot.keyToggle('control', 'up')
  })
}

// Returns a promise and clicks the all button as specified.
Character.allButtonClick = (type, time, num) => {
  let pos
  switch (type) {
    case 'UPGRADE':
      pos = Character.all.upgradePos
      break
    case 'LEVEL':
      pos = Character.all.levelPos
      break
  }

  pos = Helpers.padify(pos, Window.cornerPos)
  return Actions.clickDelay(pos, time, num)
}

// Attempts to get the first active non-clicker character on the board based
// on the slot specified, increments the slot searched if unsuccessful
Character.getCharOnBoard = (currentSlot) => {
  if (!currentSlot)
    currentSlot = 2

  // Check if the left arrow is clickable
  let pos = Helpers.padify(Character.panel.leftPos, Window.cornerPos)
  if (Scanner.colorMatch(pos, Character.panel.colorArr[0]))
    return null

  // Get all active characters and remove the clicker character
  let activeSlots = Character.getActive()
  _.pull(activeSlots, 1)

  // If there are actives
  if (activeSlots.length != 0)
    return null

  if (Character.canLevel(currentSlot)) {
    Character.levelButtonClick(currentSlot)
    currentSlot++
  }

  return currentSlot
}

// Returns a promise and clicks the reset button
Character.resetClick = () => {
  let resetSlot = Config.character.reset
  return Character.shiftPanel(resetSlot)
  .then(() => {
    // Click reset button
    let response = Character.canReset(resetSlot, [1,6])

    // Wait until reset is found
    while (!response[0]) {
      response = Character.canReset(resetSlot, [1,6])
    }
    return Actions.clickDelay(response[1], Config.delay.short_b, 1)
  })
  .then(() => {
    // Confirm reset
    let pos = Helpers.padify(Window.reset.pos_confirm, Window.cornerPos)
    return Actions.clickDelay(pos, Config.delay.short_b, 1)
  })
  .then(() => {
    // Press the shiny button
    let pos = Helpers.padify(Window.reset.pos_button, Window.cornerPos)
    return Actions.clickDelay(pos, Config.delay.medium, 1)
  })
  .then(() => {
    // Continue
    let pos = Helpers.padify(Window.reset.pos_continue, Window.cornerPos)
    return Actions.clickDelay(pos, Config.delay.long_b, 1)
  })
}

// Export the module
module.exports = Character

