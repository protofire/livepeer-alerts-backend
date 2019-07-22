const mongoose = require('../../../config/mongoose')
const utils = require('../utils')
const subscriberUtils = require('../subscriberUtils')
const delegateEmailUtils = require('../sendDelegateEmail')
const delegateTelegramUtils = require('../sendDelegateTelegram')

const getSubscribers = async subscribers => {
  let subscribersToNotify = []

  for (const subscriber of subscribers) {
    if (!subscriber || !subscriber.address) {
      continue
    }

    // Detect role
    const { constants, role, delegator } = await subscriberUtils.getSubscriptorRole(subscriber)

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
  console.log(`[Notificate-Delegates] - Start sending email notification to delegates`)
  // Fetchs only the subscribers that are delegates
  const subscribersToNotify = await subscriberUtils.getDelegatesSubscribers()
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

    subscribersToSendEmails.push(delegateEmailUtils.sendDelegateNotificationEmail(notification))
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

    subscribersToSendTelegrams.push(
      delegateTelegramUtils.sendDelegateNotificationTelegram(notification)
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
