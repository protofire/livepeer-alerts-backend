const promiseRetry = require('promise-retry')

const mongoose = require('../../../config/mongoose')

const config = require('../../../config/config')
const { minutesToWaitAfterLastSentEmail, minutesToWaitAfterLastSentTelegram } = config

const { getProtocolService } = require('../services/protocolService')
const { getDelegatorService } = require('../services/delegatorService')

const Subscriber = require('../../subscriber/subscriber.model')
const {
  sendDelegatorNotificationEmail,
  sendDelegatorNotificationDelegateChangeRulesEmail
} = require('../sendDelegatorEmail')
const { sendDelegatorNotificationTelegram } = require('../sendDelegatorTelegram')
const { getDidDelegateCalledReward, calculateIntervalAsMinutes } = require('../utils')
const subscriberUtils = require('../subscriberUtils')

const sendEmailRewardCallNotificationToDelegators = async () => {
  const subscribers = await Subscriber.find({
    frequency: 'daily',
    activated: 1,
    email: { $ne: null }
  }).exec()

  let emailsToSend = []
  const protocolService = getProtocolService()
  const delegatorService = getDelegatorService()

  const currentRoundInfo = await protocolService.getCurrentRoundInfo()

  for (const subscriber of subscribers) {
    try {
      const { role, constants, delegator } = await subscriberUtils.getSubscriptorRole(subscriber)

      if (subscriber.lastEmailSent) {
        // Calculate minutes last email sent
        const minutes = calculateIntervalAsMinutes(subscriber.lastEmailSent)

        console.log(
          `[Notificate-Delegators] - Minutes last sent email ${minutes} - Email ${subscriber.email} - Address  ${subscriber.address}`
        )

        if (minutes < minutesToWaitAfterLastSentEmail) {
          console.log(
            `[Notificate-Delegators] - Not sending email to ${subscriber.email} because already sent an email in the last ${minutesToWaitAfterLastSentEmail} minutes`
          )
          continue
        }
      }

      // Send notification only for delegators
      if (role === constants.ROLE.TRANSCODER) {
        console.log(
          `[Notificate-Delegators] - Not sending email to ${subscriber.email} because is a delegate`
        )
        continue
      }

      const [delegateCalledReward, delegatorNextReward] = await promiseRetry(retry => {
        return Promise.all([
          getDidDelegateCalledReward(delegator.delegateAddress),
          delegatorService.getDelegatorNextReward(delegator.address)
        ]).catch(err => retry())
      })

      emailsToSend.push(
        sendDelegatorNotificationEmail(
          subscriber,
          delegator,
          delegateCalledReward,
          delegatorNextReward,
          currentRoundInfo.id,
          currentRoundInfo,
          constants
        )
      )
    } catch (err) {
      console.error(err)
      console.error(
        `[Notificate-Delegators] - An error occurred sending an email to the subscriber ${subscriber.email}`
      )
    }
  }
  console.log(`[Notificate-Delegators] - Emails subscribers to notify ${emailsToSend.length}`)
  return await Promise.all(emailsToSend)
}

const sendTelegramRewardCallNotificationToDelegators = async () => {
  const subscribers = await Subscriber.find({
    frequency: 'daily',
    activated: 1,
    telegramChatId: { $ne: null }
  }).exec()

  let telegramsMessageToSend = []
  for (const subscriber of subscribers) {
    if (subscriber.lastTelegramSent) {
      // Calculate minutes last telegram sent
      const minutes = calculateIntervalAsMinutes(subscriber.lastTelegramSent)

      console.log(
        `[Notificate-Delegators] - Minutes last sent telegram ${minutes} - Telegram chat id ${subscriber.telegramChatId} - Subscriber address ${subscriber.address}`
      )

      if (minutes < minutesToWaitAfterLastSentTelegram) {
        console.log(
          `[Notificate-Delegators] - Not sending telegram to ${subscriber.address} because already sent a telegram in the last ${minutesToWaitAfterLastSentTelegram} minutes`
        )
        continue
      }
    }

    // Send notification only for delegators
    const { role, constants } = await subscriberUtils.getSubscriptorRole(subscriber)
    if (role === constants.ROLE.TRANSCODER) {
      console.log(
        `[Notificate-Delegators] - Not sending telegram to ${subscriber.telegramChatId} because is a delegate`
      )
      continue
    }
    telegramsMessageToSend.push(sendDelegatorNotificationTelegram(subscriber))
  }

  console.log(
    `[Notificate-Delegators] - Telegrams subscribers to notify ${telegramsMessageToSend.length}`
  )
  return await Promise.all(telegramsMessageToSend)
}

const sendNotificationDelegateChangeRuleToDelegators = async subscribers => {
  let subscribersToNotify = []

  for (const subscriber of subscribers) {
    const item = sendDelegatorNotificationDelegateChangeRulesEmail(subscriber)
    subscribersToNotify.push(item)
  }

  return await Promise.all(subscribersToNotify)
}

const notificateDelegatorService = {
  sendEmailRewardCallNotificationToDelegators,
  sendTelegramRewardCallNotificationToDelegators,
  sendNotificationDelegateChangeRuleToDelegators
}

module.exports = notificateDelegatorService
