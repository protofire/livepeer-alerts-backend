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
      throw new Error(`[Check-Round-Change] - Error sending notifications: ${err}`)
    }
    console.log(`[Check-Round-Change] - Notifications sent, finish check round change`)
    process.exit(0)
  }

  // There is a new round, creates it on the db, updates pools, shares and send notifications
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
  // TODO -- as enhancement, this operation should be inside a transaction and rollbacked if an error appears
  try {
    await roundCreated.save()
  } catch (err) {
    throw new Error(`[Check-Round-Change] - Error saving new round: ${err}`)
  }

  // Once the round was created, updates the shares and pools of the current round
  try {
    console.log(`[Check-Round-Change] Updating delegates pools`)
    await roundPoolsUtils.updateDelegatesPools(roundCreated)
    console.log(`[Check-Round-Change] Updating delegators shares`)
    await roundSharesUtils.updateDelegatorsShares(roundCreated)
  } catch (err) {
    // TODO - This should be inside a transaction, because if some of those two fails, the round will be already saved and the information of the pools/shares wont be saved for that round
    throw new Error(`[Check-Round-Change] - Error updating pools or shares: ${err}`)
  }

  // Finally send notifications
  try {
    console.log(`[Check-Round-Change] Sending round notifications`)
    await sendRoundNotifications(progress, roundCreated, thresholdSendNotification)
  } catch (err) {
    throw new Error(`[Check-Round-Change] - Error sending notifications: ${err}`)
  }

  console.log(`[Check-Round-Change] - Finish`)
}

workerCheckRoundChange()
  .then(() => {
    console.log(`[Check-Round-Change] - Finished, closing db connection`)
    mongoose.connection.close()
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
