const config = require('../../config/config')
const { minutesToWaitAfterLastSentEmail, minutesToWaitAfterLastSentTelegram } = config

const mongoose = require('../../config/mongoose')
const Subscriber = require('../subscriber/subscriber.model')
const {
  getSubscriptorRole,
  getDidDelegateCallReward,
  calculateIntervalAsMinutes
} = require('../helpers/utils')
const { sendDelegateNotificationEmail } = require('../helpers/sendDelegateEmail')
const { sendNotificationTelegram } = require('../helpers/sendTelegramDidRewardCall')

const getSubscribers = async subscribers => {
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

    // Check if transcoder call reward
    const delegateCalledReward = await getDidDelegateCallReward(delegator.delegateAddress)

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
    frequency: 'daily',
    activated: 1,
    email: { $ne: null }
  }).exec()
  console.log(`[Notificate-Delegates] - Start sending email notification to delegates}`)
  const subscribersToNofity = await getSubscribers(subscribers)

  const subscribersToSendEmails = []
  for (const subscriberToNotify of subscribersToNofity) {
    const { subscriber } = subscriberToNotify
    if (subscriber.lastEmailSent) {
      // Calculate minutes last email sent
      const minutes = calculateIntervalAsMinutes(subscriber.lastEmailSent)

      if (minutes < minutesToWaitAfterLastSentEmail) {
        console.log(
          `[Notificate-Delegates] - Not sending email to ${subscriber.email} because already sent an email in the last ${minutesToWaitAfterLastSentEmail} minutes`
        )
        continue
      }
    }

    subscribersToSendEmails.push(sendDelegateNotificationEmail(subscriberToNotify))
  }

  console.log(
    `[Notificate-Delegates] - Emails subscribers to notify ${subscribersToSendEmails.length}`
  )
  await Promise.all(subscribersToSendEmails)

  return subscribersToNofity
}

const sendTelegramRewardCallNotificationToDelegates = async () => {
  const subscribers = await Subscriber.find({
    frequency: 'daily',
    activated: 1,
    telegramChatId: { $ne: null }
  }).exec()

  console.log(`[Notificate-Delegates] - Start sending telegram notifications to delegates`)

  const subscribersToNofity = await getSubscribers(subscribers)

  const subscribersToSendTelegrams = []
  for (const subscriberToNotify of subscribersToNofity) {
    const { subscriber } = subscriberToNotify
    if (subscriber.lastTelegramSent) {
      // Calculate minutes last telegram sent
      const minutes = calculateIntervalAsMinutes(subscriber.lastTelegramSent)

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
