const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const mongoose = require('../../config/mongoose')
const config = require('../../config/config')
const { getLivepeerCurrentRoundInfo } = require('../helpers/livepeerAPI')
const Round = require('../round/round.model')

const {
  sendNotificationEmailFn,
  sendNotificationTelegramFn
} = require('./delegate-did-reward-call-utils')

const workerNotificationDelegateDidRewardCall = async () => {
  console.log(`[Worker notification delegate did reward call] - Start`)

  const currentRoundInfo = await getLivepeerCurrentRoundInfo()
  let { id, initialized, lastInitializedRound, length, startBlock } = currentRoundInfo

  let actualSavedRound = await Round.findOne({})
  const data = {
    roundId: id,
    initialized: initialized,
    lastInitializedRound: lastInitializedRound,
    length: length,
    startBlock: startBlock
  }

  if (!actualSavedRound) {
    let roundCreated = new Round(data)
    actualSavedRound = await roundCreated.save()
  }

  if (!actualSavedRound) {
    throw new Error(`There is no actual round`)
  }

  console.log(`[Worker notification delegate did reward call] - Actual round ${id}`)

  if (actualSavedRound.roundId !== id && initialized) {
    // Update fields
    actualSavedRound.roundId = id
    actualSavedRound.initialized = initialized
    actualSavedRound.lastInitializedRound = lastInitializedRound
    actualSavedRound.length = length
    actualSavedRound.startBlock = startBlock
    await actualSavedRound.save()

    console.log(
      `[Worker notification delegate did reward call] - Round changed, send notifications`
    )

    await Promise.all([sendNotificationEmailFn(), sendNotificationTelegramFn()])
  } else {
    console.log(`[Worker notification delegate did reward call] - No round changed`)
  }
  process.exit(0)
}

return workerNotificationDelegateDidRewardCall()
