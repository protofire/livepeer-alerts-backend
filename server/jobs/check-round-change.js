const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const mongoose = require('../../config/mongoose')
const config = require('../../config/config')

const { getProtocolService } = require('../helpers/services/protocolService')

const Round = require('../round/round.model')

const {
  sendEmailRewardCallNotificationToDelegators,
  sendTelegramRewardCallNotificationToDelegators
} = require('./notificate-delegators-utils')

const {
  sendEmailRewardCallNotificationToDelegates,
  sendTelegramRewardCallNotificationToDelegates
} = require('./notificate-delegates-utils')

const workerCheckRoundChange = async () => {
  console.log(`[Check-Round-Change] - Start`)

  const protocolService = getProtocolService()
  const currentRoundInfo = await protocolService.getLivepeerRoundProgress()
  let { id, initialized, lastInitializedRound, length, startBlock, progress } = currentRoundInfo

  let actualSavedRound = await Round.findOne({ roundId: id })

  if (actualSavedRound) {
    console.log(`[Check-Round-Change] - No round changed, actions will be not dispatched`)
  } else {
    // It's a new round -> the round changed
    const { thresholdSendNotification } = config
    console.log(`[Check-Round-Change] - Round changed, the new round is ${id}`)
    console.log(
      `[Check-Round-Change] - Check round progress: ${progress}, threshold: ${thresholdSendNotification}`
    )
    // If the progress it's above a certain threshold the notifications will be sent and the current saved round will be updated
    if (progress <= thresholdSendNotification && !actualSavedRound.notificationsForRoundSent) {
      // Send notifications
      console.log(
        `[Check-Round-Change] - The round progress is above the threshold, sending notifications`
      )
      // Send email notifications for delegate and delegators
      await Promise.all([
        sendEmailRewardCallNotificationToDelegators(),
        sendEmailRewardCallNotificationToDelegates()
      ])
      // Send telegram notifications for delegates
      await Promise.all([
        sendTelegramRewardCallNotificationToDelegators(),
        sendTelegramRewardCallNotificationToDelegates()
      ])

      // Once the notifications were sent, creates the round
      let actualSavedRound = new Round({
        roundId: id,
        initialized,
        lastInitializedRound,
        length,
        startBlock,
        notificationsForRoundSent: true
      })
      await actualSavedRound.save()

      // Finally dispatchs jobs that needs the round to be updated
    } else {
      console.log(
        `[Check-Round-Change] - The round progress is bellow the threshold or the notifications were already sent, actions will be not dispatched`
      )
    }
  }

  process.exit(0)
}

try {
  return workerCheckRoundChange()
} catch (err) {
  console.error(err)
  process.exit(1)
}
