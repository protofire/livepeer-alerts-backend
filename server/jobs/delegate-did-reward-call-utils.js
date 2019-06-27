const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const mongoose = require('../../config/mongoose')
const Subscriber = require('../subscriber/subscriber.model')
const { getLivepeerTranscoderAccount } = require('../helpers/sdk/delegate')

const { getProtocolService } = require('../helpers/services/protocolService')

const { getSubscriptorRole } = require('../helpers/utils')
const { sendNotificationEmail } = require('../helpers/sendEmailDidRewardCall')
const { sendNotificationTelegram } = require('../helpers/sendTelegramDidRewardCall')
const promiseRetry = require('promise-retry')

const getSubscribers = async subscribers => {
  const protocolService = getProtocolService()
  let subscribersToNotify = []

  for (const subscriber of subscribers) {
    if (!subscriber || !subscriber.address) {
      continue
    }

    // Detect role
    const { constants, role, delegator } = await getSubscriptorRole(subscriber)

    if (!delegator || !delegator.delegateAddress) {
      continue
    }

    if (role !== constants.ROLE.TRANSCODER) {
      continue
    }
    // OK, is a transcoder, let's send notifications

    // Get delegator with promise retry, because infura
    let [transcoderAccount, currentRoundInfo] = await promiseRetry(retry => {
      return Promise.all([
        getLivepeerTranscoderAccount(delegator.delegateAddress),
        protocolService.getCurrentRoundInfo()
      ]).catch(err => retry())
    })

    // Check if transcoder call reward
    let delegateCalledReward =
      transcoderAccount && transcoderAccount.lastRewardRound === currentRoundInfo.id

    let subscriberToNotify = {
      subscriber,
      delegateCalledReward
    }

    subscribersToNotify.push(subscriberToNotify)
  }

  return subscribersToNotify
}

const sendNotificationEmailFn = async () => {
  const subscribers = await Subscriber.find({
    frequency: 'daily',
    activated: 1,
    email: { $ne: null }
  }).exec()

  const subscribersToNofity = await getSubscribers(subscribers)

  const subscribersToSendEmails = []
  for (const subscriberToNotify of subscribersToNofity) {
    subscribersToSendEmails.push(sendNotificationEmail(subscriberToNotify))
  }

  console.log(
    `[Worker notification delegate did reward call] - Emails subscribers to notify ${
      subscribersToSendEmails.length
    }`
  )
  await Promise.all(subscribersToSendEmails)

  return subscribersToNofity
}

const sendNotificationTelegramFn = async () => {
  const subscribers = await Subscriber.find({
    frequency: 'daily',
    activated: 1,
    telegramChatId: { $ne: null }
  }).exec()

  const subscribersToNofity = await getSubscribers(subscribers)

  const subscribersToSendTelegrams = []
  for (const subscriberToNotify of subscribersToNofity) {
    subscribersToSendTelegrams.push(sendNotificationTelegram(subscriberToNotify))
  }

  console.log(
    `[Worker notification delegate did reward call] - Telegrams subscribers to notify ${
      subscribersToSendTelegrams.length
    }`
  )
  await Promise.all(subscribersToSendTelegrams)

  return subscribersToNofity
}

module.exports = {
  sendNotificationEmailFn,
  sendNotificationTelegramFn
}
