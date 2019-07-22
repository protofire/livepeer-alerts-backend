const mongoose = require('../../config/mongoose')
const Delegator = require('../delegator/delegator.model')
const Subscriber = require('../subscriber/subscriber.model')
const Telegram = require('../telegram/telegram.model')
const Round = require('../round/round.model')
const Delegate = require('../delegate/delegate.model')
const Pool = require('../pool/pool.model')
const Share = require('../share/share.model')
const config = require('../../config/config')

if (!['test', 'development'].includes(config.env)) {
  console.log('You cant use this script in this environment')
  process.exit(1)
}

let exitSendNotificationJob = false

Promise.all([
  Subscriber.deleteMany({}),
  Telegram.deleteMany({}),
  Round.deleteMany({}),
  Share.deleteMany({}),
  Delegate.deleteMany({}),
  Delegator.deleteMany({}),
  Pool.deleteMany({})
])
  .then(() => {
    console.log('Documents removed successfully')
    exitSendNotificationJob = true
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

// Wait until stack was empty
function wait() {
  if (!exitSendNotificationJob) {
    setTimeout(wait, 1000)
  } else {
    process.exit(0)
  }
}
wait()
