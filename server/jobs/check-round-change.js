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

  if (actualSavedRound || !initialized) {
    console.log(`[Check-Round-Change] - Is not the actual round or is not initialized`)
    process.exit(0)
  }

  const { thresholdSendNotification } = config

  console.log(`[Check-Round-Change] - Actual round ${id}`)
  // Check if the last round if different from the actual one to know if the round changed

  console.log(`[Check-Round-Change] - Round changed`)
  // The round changed, now checks new round progress
  console.log(
    `[Check-Round-Change] - Check round progress: ${progress}, threshold: ${thresholdSendNotification}`
  )
  // If the progress if above a certain threshold and the notifications were not already sent, the notifications will be sent and the current saved round will be updated
  if (progress >= thresholdSendNotification) {
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
    const data = {
      roundId: id,
      initialized,
      lastInitializedRound,
      length,
      startBlock
    }

    let roundCreated = new Round(data)
    await roundCreated.save()
  } else {
    console.log(
      `[Check-Round-Change] - The round progress is bellow the threshold or the notifications were already sent, actions will be not dispatched`
    )
  }

  process.exit(0)
}

try {
  return workerCheckRoundChange()
} catch (err) {
  console.error(err)
  process.exit(1)
}
