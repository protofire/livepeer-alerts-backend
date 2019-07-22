const config = require('../../../config/config')
const { minutesToWaitAfterLastSentEmail, minutesToWaitAfterLastSentTelegram } = config
const mongoose = require('../../../config/mongoose')
const { calculateIntervalAsMinutes } = require('../utils')
const subscriberUtils = require('../subscriberUtils')
const { sendDelegateNotificationEmail } = require('../sendDelegateEmail')
const { sendDelegateNotificationTelegram } = require('../sendDelegateTelegram')

const getSubscribers = async subscribers => {
  const { getDidDelegateCalledReward } = require('../utils')
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
    const delegateCalledReward = await getDidDelegateCalledReward(delegator.delegateAddress)

    let subscriberToNotify = {
      subscriber,
      delegateCalledReward
    }

    subscribersToNotify.push(subscriberToNotify)
  }

  return subscribersToNotify
}

const sendEmailRewardCallNotificationToDelegates = async emailSubscribers => {
  if (!emailSubscribers) {
    throw new Error('Email subscribers not received')
  }
  console.log(`[Notificate-Delegates] - Start sending email notification to delegates`)
  const subscribersToNofity = await getSubscribers(emailSubscribers)

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

const sendTelegramRewardCallNotificationToDelegates = async telegramSubscribers => {
  if (!telegramSubscribers) {
    throw new Error('Telegram subscribers not received')
  }
  console.log(`[Notificate-Delegates] - Start sending telegram notifications to delegates`)

  const subscribersToNotify = await getSubscribers(telegramSubscribers)

  const subscribersToSendTelegrams = []
  for (const subscriberToNotify of subscribersToNotify) {
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

    subscribersToSendTelegrams.push(sendDelegateNotificationTelegram(subscriber))
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
