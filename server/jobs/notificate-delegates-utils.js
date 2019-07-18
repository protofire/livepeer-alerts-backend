const mongoose = require('../../config/mongoose')
const Subscriber = require('../subscriber/subscriber.model')
const utils = require('../helpers/utils')
const subscriberUtils = require('../helpers/subscriberUtils')

const { sendDelegateNotificationEmail } = require('../helpers/sendDelegateEmail')
const { sendNotificationTelegram } = require('../helpers/sendTelegramDidRewardCall')

const sendEmailRewardCallNotificationToDelegates = async currentRoundInfo => {
  if (!currentRoundInfo) {
    throw new Error('No currentRoundInfo provided on sendEmailRewardCallNotificationToDelegates()')
  }
  console.log(`[Notificate-Delegates] - Start sending email notification to delegates`)
  // Fetchs only the subscribers that are delegates
  const subscribersToNotify = await subscriberUtils.getSubscribersDelegates()
  const subscribersToSendEmails = []
  const currentRoundId = currentRoundInfo.id
  for (const subscriberToNotify of subscribersToNotify) {
    const { subscriber } = subscriberToNotify
    const shouldSubscriberReceiveNotifications = subscriberUtils.shouldSubscriberReceiveEmailNotifications(
      subscriber,
      currentRoundId
    )
    if (!shouldSubscriberReceiveNotifications) {
      console.log(
        `[Notificate-Delegates] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} rounds and the frequency is ${subscriber.emailFrequency}`
      )
      continue
    }

    // Check if delegate called reward
    const delegateCalledReward = await utils.getDidDelegateCalledReward(subscriber.address)
    console.log(
      `[Notificate-Delegates] - Subscriber delegate ${subscriber.address} called reward?: ${delegateCalledReward}`
    )
    const notification = {
      subscriber,
      delegateCalledReward
    }

    subscribersToSendEmails.push(sendDelegateNotificationEmail(notification))
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
  console.log(`[Notificate-Delegates] - Start sending telegram notifications to delegates`)
  const subscribersToNofity = await subscriberUtils.getTelegramSubscribersDelegates()
  const subscribersToSendTelegrams = []
  const currentRoundId = currentRoundInfo.id
  for (const subscriberToNotify of subscribersToNofity) {
    const { subscriber } = subscriberToNotify
    const shouldSubscriberReceiveNotifications = subscriberUtils.shouldSubscriberReceiveTelegramNotifications(
      subscriber,
      currentRoundId
    )
    if (!shouldSubscriberReceiveNotifications) {
      console.log(
        `[Notificate-Delegates] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} rounds and the frequency is ${subscriber.emailFrequency}`
      )
      continue
    }
    // Check if delegate called reward
    const delegateCalledReward = await utils.getDidDelegateCalledReward(subscriber.address)
    console.log(
      `[Notificate-Delegates] - Subscriber delegate ${subscriber.address} called reward?: ${delegateCalledReward}`
    )
    const notification = {
      subscriber,
      delegateCalledReward
    }

    subscribersToSendTelegrams.push(sendNotificationTelegram(notification))
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
