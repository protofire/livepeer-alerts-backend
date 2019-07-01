const mongoose = require('../../config/mongoose')
const Subscriber = require('../models/subscriber.model')
const Telegram = require('../models/telegram.model')
const Round = require('../models/round.model')
const config = require('../../config/config')

if (!['test', 'development'].includes(config.env)) {
  console.log('You cant use this script in this enviroment')
  process.exit(-1)
}

let exitSendNotificationJob = false

Promise.all([Subscriber.deleteMany({}), Telegram.deleteMany({}), Round.deleteMany({})])
  .then(() => {
    console.log('Documents removed successfully')
    exitSendNotificationJob = true
  })
  .catch(err => {
    return console.log(err)
  })

// Wait until stack was empty
function wait() {
  if (!exitSendNotificationJob) {
    setTimeout(wait, 1000)
  } else {
    process.exit(1)
  }
}
wait()
