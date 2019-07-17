const promiseRetry = require('promise-retry')

const mongoose = require('../../config/mongoose')

const config = require('../../config/config')
const { minutesToWaitAfterLastSentTelegram } = config
const { getProtocolService } = require('../helpers/services/protocolService')
const { getDelegatorService } = require('../helpers/services/delegatorService')

const Subscriber = require('../subscriber/subscriber.model')
const delegatorEmailUtils = require('../helpers/sendDelegatorEmail')
const { sendNotificationTelegram } = require('../helpers/sendTelegramClaimRewardCall')
const utils = require('../helpers/utils')
const subscriberUtils = require('../helpers/subscriberUtils')

const sendEmailRewardCallNotificationToDelegators = async () => {
  const subscribers = await Subscriber.find({ email: { $ne: null } })

  let emailsToSend = []
  const protocolService = getProtocolService()
  const delegatorService = getDelegatorService()

  const currentRoundInfo = await protocolService.getCurrentRoundInfo()
  const currentRoundId = currentRoundInfo.id

  for (const subscriber of subscribers) {
    try {
      const { role, constants, delegator } = await subscriberUtils.getSubscriptorRole(subscriber)

      // Send notification only for delegators
      if (role === constants.ROLE.TRANSCODER) {
        console.log(
          `[Notificate-Delegators] - Not sending email to ${subscriber.email} because is a delegate`
        )
        continue
      }

      const shouldSubscriberReceiveNotifications = subscriberUtils.shouldSubscriberReceiveEmailNotifications(
        subscriber,
        currentRoundId
      )
      if (!shouldSubscriberReceiveNotifications) {
        console.log(
          `[Notificate-Delegators] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} round and the frequency is ${subscriber.emailFrequency}`
        )
        continue
      }

      const [delegateCalledReward, delegatorNextReward] = await promiseRetry(retry => {
        return Promise.all([
          utils.getDidDelegateCalledReward(delegator.delegateAddress),
          delegatorService.getDelegatorNextReward(delegator.address)
        ]).catch(err => retry())
      })

      emailsToSend.push(
        delegatorEmailUtils.sendDelegatorNotificationEmail(
          subscriber,
          delegator,
          delegateCalledReward,
          delegatorNextReward,
          currentRoundId,
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
    telegramChatId: { $ne: null }
  }).exec()

  let telegramsMessageToSend = []
  for (const subscriber of subscribers) {
    if (subscriber.lastTelegramSent) {
      // Calculate minutes last telegram sent
      const minutes = utils.calculateIntervalAsMinutes(subscriber.lastTelegramSent)

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
    telegramsMessageToSend.push(sendNotificationTelegram(subscriber))
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

module.exports = {
  sendEmailRewardCallNotificationToDelegators,
  sendTelegramRewardCallNotificationToDelegators,
  sendNotificationDelegateChangeRuleToDelegators
}
