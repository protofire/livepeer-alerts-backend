const promiseRetry = require('promise-retry')

const mongoose = require('../../config/mongoose')
const { getDelegatorService } = require('../helpers/services/delegatorService')

const Subscriber = require('../subscriber/subscriber.model')
const delegatorEmailUtils = require('../helpers/sendDelegatorEmail')
const { sendNotificationTelegram } = require('../helpers/sendTelegramClaimRewardCall')
const utils = require('../helpers/utils')
const subscriberUtils = require('../helpers/subscriberUtils')

const sendEmailRewardCallNotificationToDelegators = async currentRoundInfo => {
  if (!currentRoundInfo) {
    throw new Error('No currentRoundInfo provided on sendEmailRewardCallNotificationToDelegators()')
  }
  const subscribers = await Subscriber.find({ email: { $ne: null } })

  let emailsToSend = []
  const delegatorService = getDelegatorService()
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

const sendTelegramRewardCallNotificationToDelegators = async currentRoundInfo => {
  if (!currentRoundInfo) {
    throw new Error(
      'No currentRoundInfo provided on sendTelegramRewardCallNotificationToDelegators()'
    )
  }
  const subscribers = await Subscriber.find({
    telegramChatId: { $ne: null }
  })

  let telegramsMessageToSend = []
  const currentRoundId = currentRoundInfo.id
  for (const subscriber of subscribers) {
    // Send notification only for delegators
    const { role, constants } = await subscriberUtils.getSubscriptorRole(subscriber)
    if (role === constants.ROLE.TRANSCODER) {
      console.log(
        `[Notificate-Delegators] - Not sending telegram to ${subscriber.telegramChatId} because is a delegate`
      )
      continue
    }
    if (subscriber.lastTelegramSent) {
      const shouldSubscriberReceiveNotifications = subscriberUtils.shouldSubscriberReceiveEmailNotifications(
        subscriber,
        currentRoundId
      )
      if (!shouldSubscriberReceiveNotifications) {
        console.log(
          `[Notificate-Delegators] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} rounds and the frequency is ${subscriber.emailFrequency}`
        )
        continue
      }
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
