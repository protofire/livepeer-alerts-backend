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
    emailsToSend.push(sendNotificationEmail(subscriber))
  }

  console.log(
    `[Worker notification delegator claim reward call] - Emails subscribers to notify ${
      emailsToSend.length
    }`
  )
  return await Promise.all(emailsToSend)
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
    telegramsMessageToSend.push(sendNotificationTelegram(subscriber))
  }

  console.log(
    `[Worker notification delegator claim reward call] - Telegrams subscribers to notify ${
      telegramsMessageToSend.length
    }`
  )
  return await Promise.all(telegramsMessageToSend)
}

module.exports = {
  getSubscribersToSendEmails,
  getSubscribersToSendTelegrams
}
