const mongoose = require('../../../config/mongoose')
const utils = require('../utils')
const subscriberUtils = require('../subscriberUtils')
const delegateEmailUtils = require('../sendDelegateEmail')
const delegateTelegramUtils = require('../sendDelegateTelegram')
const { getDelegateService } = require('../services/delegateService')

const sendEmailRewardCallNotificationToDelegates = async currentRoundInfo => {
  if (!currentRoundInfo) {
    throw new Error('No currentRoundInfo provided on sendEmailRewardCallNotificationToDelegates()')
  }
  console.log(`[Notificate-Delegates] - Start sending email notification to delegates`)
  // Fetchs only the subscribers that are delegates
  const subscribersToNotify = await subscriberUtils.getEmailSubscribersDelegates()
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
        `[Notificate-Delegates] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} round and the frequency is ${subscriber.emailFrequency}`
      )
      continue
    }

    const delegateService = getDelegateService()
    // Check if delegate called reward
    const delegateCalledReward = await delegateService.getDidDelegateCalledReward(
      subscriber.address
    )
    console.log(
      `[Notificate-Delegates] - Subscriber delegate ${subscriber.address} called reward?: ${delegateCalledReward}`
    )

    subscribersToSendEmails.push(
      delegateEmailUtils.sendDelegateNotificationEmail(
        subscriber,
        delegateCalledReward,
        currentRoundId
      )
    )
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
  const subscribersToNotify = await subscriberUtils.getTelegramSubscribersDelegates()
  const subscribersToSendTelegrams = []
  const currentRoundId = currentRoundInfo.id
  for (const subscriberToNotify of subscribersToNotify) {
    const { subscriber } = subscriberToNotify
    const shouldSubscriberReceiveNotifications = subscriberUtils.shouldSubscriberReceiveTelegramNotifications(
      subscriber,
      currentRoundId
    )
    if (!shouldSubscriberReceiveNotifications) {
      console.log(
        `[Notificate-Delegates] - Not sending telegram to ${subscriber.telegramChatId} because already sent a telegram in the last ${subscriber.lastTelegramSent} round and the frequency is ${subscriber.telegramFrequency}`
      )
      continue
    }
    const delegateService = getDelegateService()
    // Check if delegate called reward
    const delegateCalledReward = await delegateService.getDidDelegateCalledReward(
      subscriber.address
    )
    console.log(
      `[Notificate-Delegates] - Subscriber delegate ${subscriber.address} called reward?: ${delegateCalledReward}`
    )

    subscribersToSendTelegrams.push(
      delegateTelegramUtils.sendDelegateNotificationTelegram(
        subscriber,
        delegateCalledReward,
        currentRoundId
      )
    )
  }

  console.log(
    `[Notificate-Delegates] - Telegrams subscribers to notify ${subscribersToSendTelegrams.length}`
  )
  await Promise.all(subscribersToSendTelegrams)

  return subscribersToNotify
}

const notificateDelegateService = {
  sendEmailRewardCallNotificationToDelegates,
  sendTelegramRewardCallNotificationToDelegates
}

module.exports = notificateDelegateService
