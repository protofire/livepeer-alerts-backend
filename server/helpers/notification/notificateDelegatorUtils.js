const promiseRetry = require('promise-retry')
const mongoose = require('../../../config/mongoose')
const { getProtocolService } = require('../services/protocolService')
const utils = require('../utils')
const subscriberUtils = require('../subscriberUtils')
const delegatorEmailUtils = require('../sendDelegatorEmail')
const delegatorTelegramUtils = require('../sendDelegatorTelegram')
const delegatorsUtils = require('../delegatorUtils')
const Share = require('../../share/share.model')
const { DAILY_FREQUENCY, WEEKLY_FREQUENCY } = require('../../../config/constants')

const sendEmailRewardCallNotificationToDelegators = async currentRoundInfo => {
  if (!currentRoundInfo) {
    throw new Error('No currentRoundInfo provided on sendEmailRewardCallNotificationToDelegators()')
  }
  console.log(`[Notificate-Delegators] - Start sending email notification to delegators`)

  const subscribersDelegators = await subscriberUtils.getEmailSubscribersDelegators()
  let emailsToSend = []
  const protocolService = getProtocolService()

  const [constants] = await promiseRetry(retry => {
    return Promise.all([protocolService.getLivepeerDefaultConstants()]).catch(err => retry())
  })
  const currentRoundId = currentRoundInfo.id

  for (const subscriberAndDelegator of subscribersDelegators) {
    const { subscriber, delegator } = subscriberAndDelegator
    try {
      const shouldSubscriberReceiveNotifications = subscriberUtils.shouldSubscriberReceiveEmailNotifications(
        subscriber,
        currentRoundId
      )

      if (
        delegator.status === constants.DELEGATOR_STATUS.Unbonded &&
        subscriber.lastEmailSentForUnbondedStatus
      ) {
        console.log(
          `[Notificate-Delegators] - Not sending email to ${subscriber.email} because is in Unbonded state and already sent an email in the last ${subscriber.lastEmailSentForUnbondedStatus} round`
        )
        continue
      } else if (subscriber.lastEmailSentForUnbondedStatus) {
        // Unset lastEmailSentForUnbondedStatus for any other status than Unbonded and property lastEmailSentForUnbondedStatus not null
        subscriber.lastEmailSentForUnbondedStatus = null
        await subscriber.save()
      }

      if (!shouldSubscriberReceiveNotifications) {
        console.log(
          `[Notificate-Delegators] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} round and the frequency is ${subscriber.emailFrequency}`
        )
        continue
      }

      let delegatorTemplateData = {}

      if (subscriber.emailFrequency === DAILY_FREQUENCY) {
        // If daily subscription send normal email
        const [delegateCalledReward, delegatorRoundReward] = await promiseRetry(retry => {
          return Promise.all([
            utils.getDidDelegateCalledReward(delegator.delegateAddress),
            Share.getDelegatorShareAmountOnRound(currentRoundInfo.id, delegator.address)
          ]).catch(err => retry())
        })

        delegatorTemplateData = {
          delegateCalledReward,
          delegatorRoundReward
        }
      }
      if (subscriber.emailFrequency === WEEKLY_FREQUENCY) {
        // If weekly subscription send weekly summary
        const delegatorSharesSummary = await delegatorsUtils.getDelegatorSharesSummary(
          delegator,
          currentRoundId
        )
        delegatorTemplateData = {
          ...delegatorSharesSummary
        }
      }

      emailsToSend.push(
        delegatorEmailUtils.sendDelegatorNotificationEmail(
          subscriber,
          delegator,
          currentRoundInfo,
          constants,
          delegatorTemplateData
        )
      )

      // If weekly subscription, send summary email
    } catch (err) {
      console.error(
        `[Notificate-Delegators] - An error occurred sending an email to the subscriber ${subscriber.email} with error: \n ${err}`
      )
    }
  }
  console.log(`[Notificate-Delegators] - Emails subscribers to notify ${emailsToSend.length}`)
  return await Promise.all(emailsToSend)
}

const sendEmailAfterBondingPeriodHasEndedNotificationToDelegators = async currentRoundInfo => {
  if (!currentRoundInfo) {
    throw new Error(
      'No currentRoundInfo provided on sendEmailAfterBondingPeriodHasEndedNotificationToDelegators()'
    )
  }
  console.log(
    `[Notificate-After-Bonding-Period-Has-Ended] - Start sending email notification to delegators`
  )

  const subscribers = await subscriberUtils.getEmailSubscribersDelegators()
  const subscribersToSendEmails = []
  const currentRoundId = currentRoundInfo.id

  for (const subscriberItem of subscribers) {
    const { subscriber } = subscriberItem

    if (!subscriber.lastPendingToBondingPeriodEmailSent) {
      subscriber.lastPendingToBondingPeriodEmailSent = currentRoundId
      await subscriber.save()
      continue
    }

    // Check if notification was already sent, backward to 1 or 2 rounds
    const differenceAlreadySended =
      +currentRoundId - (+subscriber.lastPendingToBondingPeriodEmailSent || 0)
    const isNotificationAlreadySended =
      differenceAlreadySended === 0 ||
      differenceAlreadySended === 1 ||
      differenceAlreadySended === 2

    if (isNotificationAlreadySended) {
      console.log(
        `[Notificate-After-Bonding-Period-Has-Ended] - Not sending email to ${subscriber.email} because already sent an email in the ${subscriber.lastPendingToBondingPeriodEmailSent} round`
      )
      continue
    }

    const { constants, delegator } = await subscriberUtils.getSubscriptorRole(subscriber)

    // Check difference between rounds, and if status is bonded, if the difference is between 1 or 2 since startRound, it means the subscriber is starting the bonded status
    const difference = +currentRoundId - +delegator.startRound
    const isDifferenceBetweenRoundsEqualTo = difference === 1 || difference === 2

    if (
      isDifferenceBetweenRoundsEqualTo &&
      delegator.status === constants.DELEGATOR_STATUS.Bonded
    ) {
      subscribersToSendEmails.push(
        delegatorEmailUtils.sendDelegatorNotificationBondingPeriodHasEnded(
          subscriber,
          delegator.delegateAddress,
          currentRoundId
        )
      )
    }
  }
  console.log(
    `[Notificate-After-Bonding-Period-Has-Ended] - Emails subscribers to notify ${subscribersToSendEmails.length}`
  )
  await Promise.all(subscribersToSendEmails)

  return subscribers
}

const sendTelegramAfterBondingPeriodHasEndedNotificationToDelegators = async currentRoundInfo => {
  if (!currentRoundInfo) {
    throw new Error(
      'No currentRoundInfo provided on sendTelegramAfterBondingPeriodHasEndedNotificationToDelegators()'
    )
  }
  console.log(
    `[Notificate-After-Bonding-Period-Has-Ended] - Start sending telegram notification to delegators`
  )

  const subscribers = await subscriberUtils.getTelegramSubscribersDelegators()
  const subscribersToSendTelegrams = []
  const currentRoundId = currentRoundInfo.id

  for (const subscriberItem of subscribers) {
    const { subscriber } = subscriberItem

    if (!subscriber.lastPendingToBondingPeriodTelegramSent) {
      subscriber.lastPendingToBondingPeriodTelegramSent = currentRoundId
      await subscriber.save()
      continue
    }

    // Check if notification was already sent, backward to 1 or 2 rounds
    const differenceAlreadySended =
      +currentRoundId - (+subscriber.lastPendingToBondingPeriodTelegramSent || 0)
    const isNotificationAlreadySended =
      differenceAlreadySended === 0 ||
      differenceAlreadySended === 1 ||
      differenceAlreadySended === 2

    if (isNotificationAlreadySended) {
      console.log(
        `[Notificate-After-Bonding-Period-Has-Ended] - Not sending a telegram to ${subscriber.telegramChatId} because already sent a telegram in the ${subscriber.lastPendingToBondingPeriodTelegramSent} round`
      )
      continue
    }

    const { constants, delegator } = await subscriberUtils.getSubscriptorRole(subscriber)

    // Check difference between rounds, and if status is bonded, if the difference is between 1 or 2 since startRound, it means the subscriber is starting the bonded status
    const difference = +currentRoundId - +delegator.startRound
    const isDifferenceBetweenRoundsEqualTo = difference === 1 || difference === 2

    if (
      isDifferenceBetweenRoundsEqualTo &&
      delegator.status === constants.DELEGATOR_STATUS.Bonded
    ) {
      subscribersToSendTelegrams.push(
        delegatorTelegramUtils.sendDelegatorNotificationBondingPeriodHasEnded(
          subscriber,
          currentRoundId
        )
      )
    }
  }
  console.log(
    `[Notificate-After-Bonding-Period-Has-Ended] - Telegrams subscribers to notify ${subscribersToSendTelegrams.length}`
  )
  await Promise.all(subscribersToSendTelegrams)

  return subscribers
}

const sendTelegramRewardCallNotificationToDelegators = async currentRoundInfo => {
  if (!currentRoundInfo) {
    throw new Error(
      'No currentRoundInfo provided on sendTelegramRewardCallNotificationToDelegators()'
    )
  }
  const subscribersDelegators = await subscriberUtils.getTelegramSubscribersDelegators()

  let telegramsMessageToSend = []
  const currentRoundId = currentRoundInfo.id
  for (const subscriberAndDelegator of subscribersDelegators) {
    const { subscriber, delegator } = subscriberAndDelegator
    const shouldSubscriberReceiveNotifications = subscriberUtils.shouldSubscriberReceiveTelegramNotifications(
      subscriber,
      currentRoundId
    )
    if (!shouldSubscriberReceiveNotifications) {
      console.log(
        `[Notificate-Delegators] - Not sending telegram to ${subscriber.telegramChatId} because already sent a telegram in the last ${subscriber.lastTelegramSent} round and the frequency is ${subscriber.telegramFrequency}`
      )
      continue
    }
    telegramsMessageToSend.push(
      delegatorTelegramUtils.sendDelegatorNotificationTelegram(subscriber, currentRoundId)
    )
  }

  console.log(
    `[Notificate-Delegators] - Telegrams subscribers to notify ${telegramsMessageToSend.length}`
  )
  return await Promise.all(telegramsMessageToSend)
}

const sendNotificationDelegateChangeRuleToDelegators = async subscribers => {
  let subscribersToNotify = []

  for (const subscriber of subscribers) {
    const item = delegatorEmailUtils.sendDelegatorNotificationDelegateChangeRulesEmail(subscriber)
    subscribersToNotify.push(item)
  }

  return await Promise.all(subscribersToNotify)
}

const notificateDelegatorService = {
  sendEmailRewardCallNotificationToDelegators,
  sendTelegramRewardCallNotificationToDelegators,
  sendNotificationDelegateChangeRuleToDelegators,
  sendEmailAfterBondingPeriodHasEndedNotificationToDelegators,
  sendTelegramAfterBondingPeriodHasEndedNotificationToDelegators
}

module.exports = notificateDelegatorService
