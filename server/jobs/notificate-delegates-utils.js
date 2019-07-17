const config = require('../../config/config')
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

const sendEmailRewardCallNotificationToDelegates = async currentRoundInfo => {
  if (!currentRoundInfo) {
    throw new Error('No currentRoundInfo provided on sendEmailRewardCallNotificationToDelegates()')
  }
  const subscribers = await Subscriber.find({
    email: { $ne: null }
  })
  console.log(`[Notificate-Delegates] - Start sending email notification to delegates`)
  // Fetchs only the subscribers that are delegates
  const subscribersToNotify = await getDelegateSubscribers(subscribers)
  const subscribersToSendEmails = []
  const currentRoundId = currentRoundInfo.id
  for (const subscriberToNotify of subscribersToNotify) {
    const { subscriber } = subscriberToNotify
    const shouldSubscriberReceiveNotifications = subscribersUtils.shouldSubscriberReceiveEmailNotifications(
      subscriber,
      currentRoundId
    )
    if (!shouldSubscriberReceiveNotifications) {
      console.log(
        `[Notificate-Delegates] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} rounds and the frequency is ${subscriber.emailFrequency}`
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

const sendTelegramRewardCallNotificationToDelegates = async currentRoundInfo => {
  if (!currentRoundInfo) {
    throw new Error(
      'No currentRoundInfo provided on sendTelegramRewardCallNotificationToDelegates()'
    )
  }
  const subscribers = await Subscriber.find({
    telegramChatId: { $ne: null }
  })

  console.log(`[Notificate-Delegates] - Start sending telegram notifications to delegates`)

  const subscribersToNofity = await getDelegateSubscribers(subscribers)

  const subscribersToSendTelegrams = []
  const currentRoundId = currentRoundInfo.id
  for (const subscriberToNotify of subscribersToNofity) {
    const { subscriber } = subscriberToNotify
    const shouldSubscriberReceiveNotifications = subscribersUtils.shouldSubscriberReceiveEmailNotifications(
      subscriber,
      currentRoundId
    )
    if (!shouldSubscriberReceiveNotifications) {
      console.log(
        `[Notificate-Delegates] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} rounds and the frequency is ${subscriber.emailFrequency}`
      )
      continue
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
