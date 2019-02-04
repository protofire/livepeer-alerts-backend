const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const mongoose = require('../../config/mongoose')
const config = require('../../config/config')
const { getLivepeerRoundProgress } = require('../helpers/livepeerAPI')
const Round = require('../round/round.model')
const { thresholdSendNotification } = config

const {
  getSubscribersToSendEmails,
  getSubscribersToSendTelegrams
} = require('./delegator-claim-reward-call-utils')

const checkProgressRound = async () => {
  try {
    console.log(`[Worker notification delegator claim reward call] - Start`)

    const currentRoundInfo = await getLivepeerRoundProgress()

    let {
      roundId,
      initialized,
      lastInitializedRound,
      length,
      startBlock,
      progress,
      roundLength
    } = currentRoundInfo

    let actualSavedRound = await Round.findOne({})
    const data = {
      roundId: roundId,
      initialized: initialized,
      lastInitializedRound: lastInitializedRound,
      length: roundLength,
      startBlock: startBlock
    }

    if (!actualSavedRound) {
      let roundCreated = new Round(data)
      actualSavedRound = await roundCreated.save()
    }

    if (!actualSavedRound) {
      throw new Error(`There is no actual round`)
    }

    console.log(
      `[Worker notification delegator claim reward call] - Check lock ${
        actualSavedRound.notificationsForRoundSent
      }`
    )
    if (
      progress < thresholdSendNotification &&
      actualSavedRound &&
      !actualSavedRound.notificationsForRoundSent
    ) {
      console.log(
        `[Worker notification delegator claim reward call] - Threshold reached, sending notifications`
      )

      // Send notifications
      await Promise.all([getSubscribersToSendEmails(), getSubscribersToSendTelegrams()])

      // Save lock
      actualSavedRound.notificationsForRoundSent = true
      await actualSavedRound.save()
      console.log(
        `[Worker notification delegator claim reward call] - Lock saved ${
          actualSavedRound.notificationsForRoundSent
        }`
      )
    } else if (progress > thresholdSendNotification) {
      // Clear lock
      actualSavedRound.notificationsForRoundSent = false
      await actualSavedRound.save()
      console.log(
        `[Worker notification delegator claim reward call] - Clear lock ${
          actualSavedRound.notificationsForRoundSent
        }`
      )
    }

    console.log(
      `[Worker notification delegator claim reward call] - The round have a progress of ${progress} %`
    )
  } catch (err) {
    console.log(`Error with infura`)
  }
  process.exit(0)
}

return checkProgressRound()
