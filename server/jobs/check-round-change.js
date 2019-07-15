const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const mongoose = require('../../config/mongoose')
const config = require('../../config/config')

const { sendRoundNotifications } = require('../helpers/notification/notificationUtils')
const { getProtocolService } = require('../helpers/services/protocolService')
const roundPoolsUtils = require('../helpers/updateRoundPools')
const roundSharesUtils = require('../helpers/updateRoundShares')

const Round = require('../round/round.model')

const workerCheckRoundChange = async () => {
  console.log(`[Check-Round-Change] - Start`)

  const { thresholdSendNotification } = config
  const protocolService = getProtocolService()
  const currentRoundInfo = await protocolService.getLivepeerRoundProgress()
  let { id, initialized, lastInitializedRound, length, startBlock, progress } = currentRoundInfo

  let actualSavedRound = await Round.findOne({ roundId: id })

  if (!initialized) {
    console.log(`[Check-Round-Change] - The round is not initialized. skipping checkRoundChange`)
    process.exit(0)
  }

  if (actualSavedRound) {
    console.log(`[Check-Round-Change] - The round did not changed, sending notifications if needed`)
    try {
      await sendRoundNotifications(progress, actualSavedRound, thresholdSendNotification)
    } catch (err) {
      process.exit(1)
    }
    process.exit(0)
  }

  // There is no actual round saved, the round has changed and there is a new one
  console.log(`[Check-Round-Change] - The round did changed, the new actual round is ${id}`)

  // Saves the new round locally
  const data = {
    _id: id,
    roundId: id,
    initialized,
    lastInitializedRound,
    length,
    startBlock
  }
  let roundCreated = new Round(data)
  await roundCreated.save()

  // Once the round was created, updates the shares and pools of the current round
  await roundPoolsUtils.updateDelegatesPools(roundCreated)
  await roundSharesUtils.updateDelegatorsShares(roundCreated)

  // Finally send notifications
  try {
    await sendRoundNotifications(progress, roundCreated, thresholdSendNotification)
  } catch (err) {
    process.exit(1)
  }

  console.log(`[Check-Round-Change] - Finish`)
  process.exit(0)
}

try {
  return workerCheckRoundChange()
} catch (err) {
  console.error(err)
  process.exit(1)
}
