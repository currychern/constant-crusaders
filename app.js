var Campaign = require('./app/Campaign')
var Character = require('./app/Character')
var Config = require('./app/Config')
var File = require('./app/File')
var Window = require('./app/Window')

File.readJSON('./config.json')
.then((config) => {
  // Set fields
  Config.setInfo(config)
  return File.readJSON('./app/game.json')
})
.then((game) => {
  // Set fields
  Window.setInfo(game.window)
  Campaign.setInfo(game.campaign)
  Character.setInfo(game.characters)

  return Window.findCornerPos()
})
.then((pos) => {
  Window.focus(Window.cornerPos, Window.dim)

  if (!Campaign.stage)
    Campaign.stage = 'START'
  
  Campaign.logStage()
  switch (Campaign.stage) {
    case 'END':
      Campaign.endStage()
      break
    case 'MIDDLE':
      Campaign.middleStage()
      break
    case 'EARLY':
      Campaign.earlyStage()
      break
    default:
      Campaign.startStage(Config.delay.short)
      break
  }
})
