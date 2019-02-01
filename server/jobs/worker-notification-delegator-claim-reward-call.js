const Promise = require('bluebird')
Promise.config({
  cancellation: true
})

const mongoose = require('../../config/mongoose')
const config = require('../../config/config')
const { getLivepeerRoundProgress } = require('../helpers/livepeerAPI')
const { thresholdSendNotification } = config

const {
  getSubscribersToSendEmails,
  getSubscribersToSendTelegrams
} = require('./delegator-claim-reward-call-utils')

const checkProgressRound = async () => {
  console.log(`[Worker notification delegator claim reward call] - Start`)

  const currentRoundInfo = await getLivepeerRoundProgress()

  if (currentRoundInfo.progress < thresholdSendNotification) {
    console.log(
      `[Worker notification delegator claim reward call] - The round have a progress of ${
        currentRoundInfo.progress
      } %`
    )
    console.log(
      `[Worker notification delegator claim reward call] - Threshold reached, sending notifications`
    )
    await Promise.all([getSubscribersToSendEmails(), getSubscribersToSendTelegrams()])
  }

  console.log(
    `[Worker notification delegator claim reward call] - The round have a progress of ${
      currentRoundInfo.progress
    } %`
  )
  process.exit(0)
}

return checkProgressRound()
