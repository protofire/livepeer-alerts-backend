const config = require('../../config/config')
const { minutesToWaitAfterLastSentTelegram } = config
const mongoose = require('../../config/mongoose')
const Subscriber = require('../subscriber/subscriber.model')
const utils = require('../helpers/utils')
const subscribersUtils = require('../helpers/subscriberUtils')

const { sendDelegateNotificationEmail } = require('../helpers/sendDelegateEmail')
const { sendNotificationTelegram } = require('../helpers/sendTelegramDidRewardCall')

const getDelegateSubscribers = async subscribers => {
  let subscribersToNotify = []

  for (const subscriber of subscribers) {
    if (!subscriber || !subscriber.address) {
      continue
    }

    // Detect role
    const { constants, role, delegator } = await subscribersUtils.getSubscriptorRole(subscriber)

    if (!delegator || !delegator.delegateAddress) {
      continue
    }

    if (role !== constants.ROLE.TRANSCODER) {
      continue
    }
    // OK, is a transcoder, let's send notifications

    // Check if transcoder call reward
    const delegateCalledReward = await utils.getDidDelegateCalledReward(delegator.delegateAddress)

    let subscriberToNotify = {
      subscriber,
      delegateCalledReward
    }

    subscribersToNotify.push(subscriberToNotify)
  }

  return subscribersToNotify
}

const sendEmailRewardCallNotificationToDelegates = async () => {
  const subscribers = await Subscriber.find({
    email: { $ne: null }
  })
  console.log(`[Notificate-Delegates] - Start sending email notification to delegates`)
  const subscribersToNotify = await getDelegateSubscribers(subscribers)
  const subscribersToSendEmails = []
  const protocolService = getProtocolService()
  const currentRoundInfo = await protocolService.getCurrentRoundInfo()
  const currentRoundId = currentRoundInfo.id
  for (const subscriberToNotify of subscribersToNotify) {
    const { subscriber } = subscriberToNotify
    const shouldSubscriberReceiveNotifications = subscribersUtils.shouldSubscriberReceiveEmailNotifications(
      subscriber,
      currentRoundId
    )
    if (!shouldSubscriberReceiveNotifications) {
      console.log(
        `[Notificate-Delegators] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} rounds and the frequency is ${subscriber.emailFrequency}`
      )
      continue
    }

    subscribersToSendEmails.push(sendDelegateNotificationEmail(subscriberToNotify))
  }

  console.log(
    `[Notificate-Delegates] - Emails subscribers to notify ${subscribersToSendEmails.length}`
  )
  await Promise.all(subscribersToSendEmails)

  return subscribersToNotify
}

const sendTelegramRewardCallNotificationToDelegates = async () => {
  const subscribers = await Subscriber.find({
    telegramChatId: { $ne: null }
  }).exec()

  console.log(`[Notificate-Delegates] - Start sending telegram notifications to delegates`)

  const subscribersToNofity = await getDelegateSubscribers(subscribers)

  const subscribersToSendTelegrams = []
  for (const subscriberToNotify of subscribersToNofity) {
    const { subscriber } = subscriberToNotify
    if (subscriber.lastTelegramSent) {
      // Calculate minutes last telegram sent
      const minutes = utils.calculateIntervalAsMinutes(subscriber.lastTelegramSent)

      if (minutes < minutesToWaitAfterLastSentTelegram) {
        console.log(
          `[Notificate-Delegates] - Not sending telegram to ${subscriber.address} because already sent a telegram in the last ${minutesToWaitAfterLastSentTelegram} minutes`
        )
        continue
      }
    }

    subscribersToSendTelegrams.push(sendNotificationTelegram(subscriberToNotify))
  }

  console.log(
    `[Notificate-Delegates] - Telegrams subscribers to notify ${subscribersToSendTelegrams.length}`
  )
  await Promise.all(subscribersToSendTelegrams)

  return subscribersToNofity
}

module.exports = {
  sendEmailRewardCallNotificationToDelegates,
  sendTelegramRewardCallNotificationToDelegates
}
