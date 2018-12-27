const path = require('path')
const mongoose = require('../../config/mongoose')
const Subscriber = require('../subscriber/subscriber.model')
const { sendNotificationEmail } = require('../helpers/sendEmail')

// Get arguments
const argv = require('minimist')(process.argv.slice(2))
const { frequency = 'daily' } = argv

const validFrequencies = ['monthly', 'weekly', 'daily', 'hourly']

// Validate frequencies
if (!validFrequencies.includes(frequency)) {
  throw new Error(`${frequency} is not a valid frequency parameter`)
}

// Get subscribers
let exitSendNotificationJob = false

Subscriber.find({ frequency: frequency, activated: 1 })
  .exec()
  .then(async subscribers => {
    let emailsToSend = []
    subscribers.forEach(subscriber => {
      emailsToSend.push(sendNotificationEmail(subscriber))
    })
    try {
      await Promise.all(emailsToSend)
      exitSendNotificationJob = true
    } catch (error) {
      console.error(error)
    }
    return subscribers
  })
  .catch(function(err) {
    throw err
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
