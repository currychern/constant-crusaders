'use strict'

var robot = require('robotjs')

var Character = require('./Character')
var Config = require('./Config')
var Helpers = require('./Helpers')
var Scanner = require('./Scanner')
var Window = require('./Window')

const X = 0, Y = 1, W = 0, H = 1

var timerArea

// Create the "class" wrapper
var Campaign = {
  lootSection: {
    pos: null,
    dim: null,
  },
  instakill: {
    x: 0,
    yRange: null
  },
  areaSection: {
    pos: null,
    dim: null,
    dist: 0
  },
  continueArrow : {
    pos: null,
    dim: null
  },

  stage: null,
  area: 0
}

// Sets field parameters based on JSON data
Campaign.setInfo = (camp) => {
  let loot = camp.section_loot
  Campaign.lootSection.pos = [loot.x, loot.y]
  Campaign.lootSection.dim = [loot.w, loot.h]

  let instakill = camp.line_instakill
  Campaign.instakill.x = instakill.x
  Campaign.instakill.yRange = [instakill.y_min, instakill.y_max]

  let area = camp.section_area
  Campaign.areaSection.pos = [area.x, area.y]
  Campaign.areaSection.dim = [area.w, area.h]
  Campaign.areaSection.dist = Math.round(area.w / area.n)

  let cont = camp.arrow_continue
  Campaign.continueArrow.pos = [cont.x, cont.y]
  Campaign.continueArrow.dim = [cont.w, cont.h]

  let config = Config.campaign
  if (config.stage)
    Campaign.stage = config.stage
  if (config.area)
    Campaign.area = config.area
}

/*Stages***********************************************************************/

// Start stage: collect loot and get a non-clicker character on the board
Campaign.startStage = (time, slot) => {
  if(!timerArea)
    timerArea = Campaign.setAreaTimer()

  setTimeout(() => {
    Campaign.collectLoot(true, 'FAST')
    slot = Character.getCharOnBoard(slot)
    if (slot)
      Campaign.startStage(time, slot)
    else {
      Campaign.stage = 'EARLY'
      Campaign.logStage()
      Campaign.earlyStage()
    }
  }, time)
}

// Early stage: level up and upgrade all characters until reset is available
Campaign.earlyStage = () => {
  if(!timerArea)
    timerArea = Campaign.setAreaTimer()

  let timerCollect = setInterval(() => { Campaign.collectLoot(false) }, Config.delay.collect)

  let timerUpgrade = setInterval(() => {
    Character.allButtonClick('LEVEL', Config.delay.short, 1)
    .then(() => {
      setTimeout(() => { robot.keyTap('q') }, Config.delay.medium)
      Character.allButtonClick('UPGRADE', Config.delay.medium, 1)
    })
  }, Config.delay.all)

  let timers = [timerCollect, timerUpgrade]

  let timerReset = setInterval(() => {
    let resetSlot = Config.character.reset
    Character.shiftPanel(resetSlot)
    .then(() => {
      setTimeout(() => {
        if(Character.canReset(resetSlot, [1,6])[0]) {
          timers.push(timerReset)
          Helpers.clearIntervals(timers)
          Campaign.stage = 'MIDDLE'
          Campaign.logStage()
          Campaign.middleStage()
        }
      }, Config.delay.long)
    })
  }, Config.delay.reset)
}

// Middle stage: level up DPS and upgrade all until you cannot instakill
Campaign.middleStage = () => {
  if(!timerArea)
    timerArea = Campaign.setAreaTimer()

  let timerCollect = setInterval(() => {
    Campaign.collectLoot(false)
  }, Config.delay.collect)

  let timerLevelDPS = setInterval(() => {
    Character.levelButtonClick(Config.character.dps)
  }, Config.delay.level.long)

  let timerLevelAll = setInterval(() => {
    Character.allButtonClick('LEVEL', Config.delay.short, 1)
  }, Config.delay.all)

  let timers = [timerCollect, timerLevelDPS, timerLevelAll]

  timerStalled(timers)

  function timerStalled(timers, prevScan) {
    setTimeout(() => {
      let scan = []
      let response = Campaign.scanInstakill(prevScan)
      if (response[0])
        timerStalled(timers, response[1])
      else {
        Helpers.clearIntervals(timers)
        Campaign.stage = 'END'
        Campaign.logStage()
        Campaign.endStage()
      }
    }, Config.delay.kill)
  }
}

// End stage: click fast and level DPS frequently
Campaign.endStage = () => {
  if(!timerArea)
    timerArea = Campaign.setAreaTimer()

  let timerCollect = setInterval(() => {
    Campaign.collectLoot(true, 'FAST')
  }, Config.delay.collect)

  let timerLevelDPS = setInterval(() => {
    Character.levelButtonClick(Config.character.dps)
  }, Config.delay.level.short)

  let timerLevelAll = setInterval(() => {
    Character.allButtonClick('LEVEL', Config.delay.short, 1)
  }, Config.delay.all)

  let timers = [timerCollect, timerLevelDPS, timerLevelAll, timerArea]

  //logic for reset button
  if (Config.campaign.reset) {
    timerAreaReached()
  }
  else {
    timerAreaChanged()
  }

  function timerAreaReached() {
    setTimeout(() => {
      if (Campaign.area > Config.campaign.reset) {
        Character.allButtonClick('LEVEL', Config.delay.short, 1)
        .then(() => {
          setTimeout(() => {
            if (Config.campaign.autoreset)
              Character.resetClick()
            Helpers.clearIntervals(timers)
            console.log('COMPLETE!')
          }, Config.delay.long)
        })
      }
      else {
        Campaign.continueIfWiped()
        timerAreaReached()
      }
    }, Config.delay.reset)
  }

  function timerAreaChanged(prevArea) {
    setTimeout(() => {
      if (prevArea === Campaign.area) {
        Character.allButtonClick('LEVEL', Config.delay.short, 1)
        .then(() => {
          setTimeout(() => {
            if (Config.campaign.autoreset)
              Character.resetClick()
            Helpers.clearIntervals(timers)
            console.log('COMPLETE!')
          }, Config.delay.long)
        })
      }
      else {
        timerAreaChanged(Campaign.area)
      }
    }, Config.delay.reset)
  }
}



/*Gets-Sets-Updates************************************************************/

// Gets the position where the area section starts
Campaign.getAreaSection = () => {
  let pos = [Campaign.areaSection.pos[X], Campaign.areaSection.pos[Y]]
  return Helpers.padify(pos, Window.cornerPos)
}

// Gets the position where the continue arrow starts
Campaign.getContinueArrow = () => {
  let pos = [Campaign.continueArrow.pos[X], Campaign.continueArrow.pos[Y]]
  return Helpers.padify(pos, Window.cornerPos)
}

// Slices the area section vertically into fifths and returns the partition num
Campaign.getAreaSlice = (pos) => {
  let areaPos = Campaign.getAreaSection()

   if (pos[X] < areaPos[X] + Campaign.areaSection.dist)
     return 1
   else if (pos[X] < areaPos[X] + Campaign.areaSection.dist * 2)
     return 2
   else if (pos[X] < areaPos[X] + Campaign.areaSection.dist * 3)
     return 3
   else if (pos[X] < areaPos[X] + Campaign.areaSection.dist * 4)
     return 4
   else
     return 5
}

// Updates the current area based on a scan of the map
Campaign.updateArea = () => {
  let prevArea = Campaign.area
  let pos = Campaign.findLevelArrowPos()

  if (pos) {
    let n = Campaign.getAreaSlice(pos)

    if ((prevArea - 1) % 5 <= (n - 1))
      Campaign.area = Helpers.floor5(prevArea) + n
    else {
      Campaign.area = Helpers.ceil5(prevArea) + n
    }
  }

  return Campaign.area
}

/*Helpers**********************************************************************/

// Outputs the current stage of the Campaign
Campaign.logStage = () => {
  console.log('STAGE: ' + Campaign.stage)
}


Campaign.setAreaTimer = () => {
  return setInterval(() => {
    Campaign.updateArea()
  }, Config.delay.area)
}

/*Scans************************************************************************/

// Returns boolean indicating if the campaign is still in instakill mode, also
// returns the color string to use in the next scan if true
Campaign.scanInstakill = (prevScan) => {
  let scan = []
  let yMin = Campaign.instakill.yRange[0]
  let yMax = Campaign.instakill.yRange[1]
  for (var n = 0; n < 10; n++) {
    let y = Math.round((yMax - yMin) / 9 * n + yMin)
    let pos = Helpers.padify([Campaign.instakill.x, y], Window.cornerPos)
    scan.push(robot.getPixelColor(pos[X], pos[Y]))
  }
  if (prevScan === scan.toString())
    return [false, '']
  else
    return [true, scan.toString()]
}

// Returns the position of the area arrow on the map
Campaign.findLevelArrowPos = () => {
  let pos = Campaign.getAreaSection()
  let dim = Campaign.areaSection.dim

  let bmp = robot.screen.capture(pos[X], pos[Y], dim[W], dim[H])

  let arrowPos = Scanner.nthYellowInColumnPos(bmp, 2, 4)

  if(!arrowPos)
    return null

  return Helpers.addPos(pos, arrowPos)
}

/*Actions**********************************************************************/

// Collects loot that is dropped by kills and autoclicks as specified
Campaign.collectLoot = (click, rate) => {
  let xMin = Campaign.lootSection.pos[X]
  let xMax = Campaign.lootSection.pos[X] + Campaign.lootSection.dim[W]
  let y = Campaign.lootSection.pos[Y] + Campaign.lootSection.dim[H] / 2

  // Set click speed based on rate
  let modulus = 9999
  switch (rate) {
    case 'FAST':
      modulus = 7
      break
    case 'NORMAL':
      modulus = 20
      break
    case 'SLOW':
      modulus = 50
      break
  }

  // Move mouse in a line to collect loot
  for (var x = xMin; x < xMax; x+=5) {
    let pos = Helpers.padify([x,y], Window.cornerPos)
    robot.moveMouse(pos[X], pos[Y])
    if (x % modulus == 0 && click)
      robot.mouseClick()
  }
}

// Scans the map for the continue arrow and presses the auto progress hotkey if found
Campaign.continueIfWiped = () => {
  let pos = Campaign.getContinueArrow()
  let dim = Campaign.continueArrow.dim

  let bmp = robot.screen.capture(pos[X], pos[Y], dim[W], dim[H])

  let cont = Scanner.nthYellowInColumnPos(bmp, 2, 4)

  if(cont)
    robot.keyTap('g')
}

// Export the module
module.exports = Campaign
