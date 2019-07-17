const promiseRetry = require('promise-retry')

const mongoose = require('../../config/mongoose')

const config = require('../../config/config')
const { minutesToWaitAfterLastSentTelegram } = config
const { DAILY_FREQUENCY, WEEKLY_FREQUENCY } = require('../../config/constants')

const { getProtocolService } = require('../helpers/services/protocolService')
const { getDelegatorService } = require('../helpers/services/delegatorService')

const Subscriber = require('../subscriber/subscriber.model')
const delegatorEmailUtils = require('../helpers/sendDelegatorEmail')
const { sendNotificationTelegram } = require('../helpers/sendTelegramClaimRewardCall')
const utils = require('../helpers/utils')

const SubscriberUtils = require('../helpers/subscriberUtils')

const sendEmailRewardCallNotificationToDelegators = async () => {
  const subscribers = await Subscriber.find({ email: { $ne: null } })

  let emailsToSend = []
  const protocolService = getProtocolService()
  const delegatorService = getDelegatorService()

  const currentRoundInfo = await protocolService.getCurrentRoundInfo()
  const currentRoundId = currentRoundInfo.id

  for (const subscriber of subscribers) {
    try {
      const { role, constants, delegator } = await SubscriberUtils.getSubscriptorRole(subscriber)

      // Send notification only for delegators
      if (role === constants.ROLE.TRANSCODER) {
        console.log(
          `[Notificate-Delegators] - Not sending email to ${subscriber.email} because is a delegate`
        )
        continue
      }

      /**
       * Checks that the last round in which the an email was sent, is bellow the frequency that the subscriber selected
       * For example: the subscriber has a frequency of 'daily', the last round in which the job sent an email is 1
       * The current round is 2 => an email must be sended. If the frequency was 'weekly' the email must be sent on the round 8.
       */
      if (subscriber.lastEmailSent) {
        const roundsBetweenLastEmailSent = currentRoundId - subscriber.lastEmailSent
        console.log(
          `[Notificate-Delegators] - Rounds between last email sent and current round: ${roundsBetweenLastEmailSent} - Subscription frequency: ${subscriber.emailFrequency} - Email ${subscriber.email} - Address  ${subscriber.address}`
        )
        switch (subscriber.emailFrequency) {
          case DAILY_FREQUENCY: {
            if (roundsBetweenLastEmailSent < 1) {
              console.log(
                `[Notificate-Delegators] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} round and the frequency is ${subscriber.emailFrequency}`
              )
              continue
            }
            break
          }
          case WEEKLY_FREQUENCY: {
            if (roundsBetweenLastEmailSent < 7) {
              console.log(
                `[Notificate-Delegators] - Not sending email to ${subscriber.email} because already sent an email in the last ${subscriber.lastEmailSent} rounds and the frequency is ${subscriber.emailFrequency}`
              )
              continue
            }
            break
          }
          default: {
            console.error(
              `The subscriber: ${subscriber._id} has a non-supported frequency: ${subscriber.emailFrequency}`
            )
            continue
          }
        }
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
    const { role, constants } = await SubscriberUtils.getSubscriptorRole(subscriber)
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
