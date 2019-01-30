const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const mongoose = require('../../config/mongoose')
const Subscriber = require('../subscriber/subscriber.model')
const { sendNotificationEmail } = require('../helpers/sendEmailClaimRewardCall')
const { sendNotificationTelegram } = require('../helpers/sendTelegramClaimRewardCall')
const { getSubscriptorRole } = require('../helpers/utils')

// Get arguments
const argv = require('minimist')(process.argv.slice(2))
const { frequency = 'daily', type = 'email' } = argv

const validFrequencies = ['monthly', 'weekly', 'daily', 'hourly']

// Validate frequencies
if (!validFrequencies.includes(frequency)) {
  throw new Error(
    `${frequency} is not a valid frequency parameter, must be ${validFrequencies.join(',')}`
  )
}

const validTypes = ['email', 'telegram']

// Validate types
if (!validTypes.includes(type)) {
  throw new Error(`${type} is not a valid type parameter, must be ${validTypes.join(',')}`)
}

// Get subscribers
let exitSendNotificationJob = false

const sendNotificationEmailFn = () => {
  Subscriber.find({ frequency: frequency, activated: 1, email: { $ne: null } })
    .exec()
    .then(async subscribers => {
      let emailsToSend = []
      for (const subscriber of subscribers) {
        // Send notification only for delegators
        const { role, constants } = await getSubscriptorRole(subscriber)
        if (role !== constants.ROLE.DELEGATOR) {
          continue
        }
        emailsToSend.push(sendNotificationEmail(subscriber, true))
      }
      try {
        await Promise.all(emailsToSend)
      } catch (error) {
        console.error(error)
      }
      exitSendNotificationJob = true
      return subscribers
    })
    .catch(function(err) {
      throw err
    })
}

const sendNotificationTelegramFn = () => {
  Subscriber.find({ frequency: frequency, activated: 1, telegramChatId: { $ne: null } })
    .exec()
    .then(async subscribers => {
      let telegramsMessageToSend = []
      for (const subscriber of subscribers) {
        // Send notification only for delegators
        const { role, constants } = await getSubscriptorRole(subscriber)
        if (role !== constants.ROLE.DELEGATOR) {
          continue
        }
        telegramsMessageToSend.push(sendNotificationTelegram(subscriber, true))
      }
      try {
        await Promise.all(telegramsMessageToSend)
      } catch (error) {
        console.error(error)
      }
      exitSendNotificationJob = true
      return subscribers
    })
    .catch(function(err) {
      throw err
    })
}

// Dispatcher notification
switch (type) {
  case 'email':
    sendNotificationEmailFn()
    break
  case 'telegram':
    sendNotificationTelegramFn()
    break
  default:
}

// Wait until stack was empty
function wait() {
  if (!exitSendNotificationJob) {
    setTimeout(wait, 1000)
  } else {
    process.exit(1)
  }
}
wait()
