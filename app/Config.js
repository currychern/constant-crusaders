'use strict'

// Create the "class" wrapper
var Config = {
  cornerPos: null,
  delay: {
    short: 0,
    short_b: 0,
    medium: 0,
    long: 0,
    long_b: 0,

    area: 0,
    collect: 0,
    level: {
      short: 0,
      long: 0
    },
    all: 0,
    kill: 0,
    reset: 0
  },
  campaign: {
    stage: null,
    area: 0,
    reset: 0,
    autoreset: false
  },
  character: {
    dps: 0,
    reset: 0
  }
}

// Sets field parameters based on JSON data
Config.setInfo = (config) => {
  Config.cornerPos = config.pos_corner

  let delay = config.delay
  Config.delay.short = delay.short
  Config.delay.short_b = delay.short_b
  Config.delay.medium = delay.medium
  Config.delay.long = delay.long
  Config.delay.long_b = delay.long_b

  Config.delay.level.short = delay.levelUp.short
  Config.delay.level.long = delay.levelUp.long

  Config.delay.area = delay.checkArea
  Config.delay.collect = delay.collectLoot
  Config.delay.all = delay.clickAll
  Config.delay.kill = delay.checkInstakill
  Config.delay.reset = delay.checkReset

  let camp = config.campaign
  Config.campaign.stage = camp.stage
  Config.campaign.area = camp.area
  Config.campaign.reset = camp.level_reset
  Config.campaign.autoreset = camp.auto_reset

  let char = config.character
  Config.character.dps = char.dps
  Config.character.reset = char.reset
}

// Export the module
module.exports = Config

