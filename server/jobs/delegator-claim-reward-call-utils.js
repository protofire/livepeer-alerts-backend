const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const mongoose = require('../../config/mongoose')
const Subscriber = require('../subscriber/subscriber.model')
const { sendNotificationEmail } = require('../helpers/sendEmailClaimRewardCall')
const { sendNotificationTelegram } = require('../helpers/sendTelegramClaimRewardCall')
const { getSubscriptorRole } = require('../helpers/utils')

const getSubscribersToSendEmails = async () => {
  const subscribers = await Subscriber.find({
    frequency: 'daily',
    activated: 1,
    email: { $ne: null }
  }).exec()

  let emailsToSend = []
  for (const subscriber of subscribers) {
    // Send notification only for delegators
    const { role, constants } = await getSubscriptorRole(subscriber)
    if (role === constants.ROLE.TRANSCODER) {
      continue
    }
    emailsToSend.push(sendNotificationEmail(subscriber, true))
  }

  return subscribers
}

const getSubscribersToSendTelegrams = async () => {
  const subscribers = await Subscriber.find({
    frequency: 'daily',
    activated: 1,
    telegramChatId: { $ne: null }
  }).exec()

  let telegramsMessageToSend = []
  for (const subscriber of subscribers) {
    // Send notification only for delegators
    const { role, constants } = await getSubscriptorRole(subscriber)
    if (role === constants.ROLE.TRANSCODER) {
      continue
    }
    telegramsMessageToSend.push(sendNotificationTelegram(subscriber, true))
  }

  return subscribers
}

module.exports = {
  getSubscribersToSendEmails,
  getSubscribersToSendTelegrams
}
