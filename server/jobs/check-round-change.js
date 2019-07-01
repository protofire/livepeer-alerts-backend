const {
  sendEmailRewardCallNotificationToDelegators,
  sendTelegramRewardCallNotificationToDelegators
} = require('./notificate-delegators-utils')

const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const mongoose = require('../../config/mongoose')
const config = require('../../config/config')
const { getProtocolService } = require('../helpers/services/protocolService')

const Round = require('../round/round.model')

const {
  sendEmailRewardCallNotificationToDelegates,
  sendTelegramRewardCallNotificationToDelegates
} = require('./notificate-delegates-utils')

const workerCheckRoundChange = async () => {
  console.log(`[Check-Round-Change] - Start`)

  const protocolService = getProtocolService()
  const currentRoundInfo = await protocolService.getLivepeerRoundProgress()
  let { id, initialized, lastInitializedRound, length, startBlock, progress } = currentRoundInfo

  const data = {
    roundId: id,
    initialized,
    lastInitializedRound,
    length,
    startBlock
  }

  let actualSavedRound = await Round.findOne({})

  // Initializes db if there are no rounds saved
  if (!actualSavedRound) {
    let roundCreated = new Round(data)
    actualSavedRound = await roundCreated.save()
  }

  if (!actualSavedRound) {
    throw new Error(`There is no actual round`)
  }

  const { thresholdSendNotification } = config

  console.log(`[Check-Round-Change] - Actual round ${id} - Last round ${actualSavedRound.roundId}`)
  // Check if the last round if different from the actual one to know if the round changed
  if (actualSavedRound.roundId !== id && initialized) {
    console.log(`[Check-Round-Change] - Round changed`)
    // The round changed, now checks new round progress
    console.log(
      `[Check-Round-Change] - Check round progress: ${progress}, threshold: ${thresholdSendNotification}, notifications were sent?: ${
        actualSavedRound.notificationsForRoundSent
      }`
    )
    // If the progress if above a certain threshold and the notifications were not already sent, the notifications will be sent and the current saved round will be updated
    if (progress >= thresholdSendNotification && !actualSavedRound.notificationsForRoundSent) {
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

      // Once the notifications are sent, update round and lock
      actualSavedRound.roundId = id
      actualSavedRound.initialized = initialized
      actualSavedRound.lastInitializedRound = lastInitializedRound
      actualSavedRound.length = length
      actualSavedRound.startBlock = startBlock
      actualSavedRound.notificationsForRoundSent = true
      await actualSavedRound.save()
    } else {
      console.log(
        `[Check-Round-Change] - The round progress is bellow the threshold or the notifications were already sent, actions will be not dispatched`
      )
    }
  } else {
    console.log(`[Check-Round-Change] - No round changed, actions will be not dispatched`)
  }

  process.exit(0)
}

return workerCheckRoundChange()
