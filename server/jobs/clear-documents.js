const mongoose = require('../../config/mongoose')
const Subscriber = require('../subscriber/subscriber.model')
const Earning = require('../earning/earning.model')
const Telegram = require('../telegram/telegram.model')
const config = require('../../config/config')

if (!['test', 'development'].includes(config.env)) {
  console.log('You cant use this script in this enviroment')
  process.exit(-1)
}

let exitSendNotificationJob = false

Promise.all([Subscriber.deleteMany({}), Earning.deleteMany({}), Telegram.deleteMany({})])
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
