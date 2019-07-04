const promiseRetry = require('promise-retry')
const moment = require('moment')

const mongoose = require('../../config/mongoose')

const config = require('../../config/config')
const { minutesToWaitAfterLastSentEmail } = config

const { getProtocolService } = require('../helpers/services/protocolService')
const { getDelegatorService } = require('../helpers/services/delegatorService')

const Subscriber = require('../subscriber/subscriber.model')
const { sendDelegatorNotificationEmail } = require('../helpers/sendDelegatorEmail')
const { sendNotificationTelegram } = require('../helpers/sendTelegramClaimRewardCall')
const { getSubscriptorRole, getDidDelegateCallReward } = require('../helpers/utils')

const getSubscribersToSendEmails = async () => {
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
      const { role, constants, delegator } = await getSubscriptorRole(subscriber)

      if (subscriber.lastEmailSent) {
        // Calculate hours last email sent
        const now = moment(new Date())
        const end = moment(subscriber.lastEmailSent)

        const duration = moment.duration(now.diff(end))
        const minutes = duration.asMinutes()

        console.log(
          `[Worker notification delegator claim reward call] - Minutes last sent email ${minutes} - Email ${subscriber.email}`
        )

        if (minutes < minutesToWaitAfterLastSentEmail) {
          console.log(
            `[Worker notification delegator claim reward call] - Not sending email to ${subscriber.email} because already sent an email in the last ${minutesToWaitAfterLastSentEmail} minutes`
          )
          continue
        }
      }

      // Send notification only for delegators
      if (role === constants.ROLE.TRANSCODER) {
        console.log(
          `[Worker notification delegator claim reward call] - Not sending email to ${subscriber.email} because is a transcoder`
        )
        continue
      }

      const [delegateCalledReward, delegatorNextReward] = await promiseRetry(retry => {
        return Promise.all([
          getDidDelegateCallReward(delegator.delegateAddress),
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
        `[Worker notification delegator claim reward call] - An error occurred sending an email to the subscriber ${subscriber.email}`
      )
    }
  }
  console.log(
    `[Worker notification delegator claim reward call] - Emails subscribers to notify ${emailsToSend.length}`
  )
  return await Promise.all(emailsToSend)
}

const getSubscribersToSendTelegrams = async () => {
  const subscribers = await Subscriber.find({
    frequency: 'daily',
    activated: 1,
    telegramChatId: { $ne: null }
  }).exec()

  let telegramsMessageToSend = []
  for (const subscriber of subscribers) {
    // Send notification only for delegators
    const { role, constants } = await getSubscriptorRole(subscriber)
    if (role === constants.ROLE.TRANSCODER) {
      continue
    }
    telegramsMessageToSend.push(sendNotificationTelegram(subscriber))
  }

  console.log(
    `[Worker notification delegator claim reward call] - Telegrams subscribers to notify ${telegramsMessageToSend.length}`
  )
  return await Promise.all(telegramsMessageToSend)
}

module.exports = {
  getSubscribersToSendEmails,
  getSubscribersToSendTelegrams
}
