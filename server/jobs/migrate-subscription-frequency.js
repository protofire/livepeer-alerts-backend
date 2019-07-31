const mongoose = require('../../config/mongoose')
const Subscriber = require('../subscriber/subscriber.model')
const { getProtocolService } = require('../helpers/services/protocolService')

const { DAILY_FREQUENCY } = require('../../config/constants')

let exitJob = false
Subscriber.find({})
  .then(async subscribers => {
    const protocolService = getProtocolService()
    const currentRoundInfo = await protocolService.getCurrentRoundInfo()
    const currentRoundId = currentRoundInfo.id

    for (let subscriber of subscribers) {
      console.log(`Before`, JSON.parse(JSON.stringify(subscriber)))

      subscriber.emailFrequency = subscriber.frequency || DAILY_FREQUENCY
      subscriber.telegramFrequency = subscriber.frequency || DAILY_FREQUENCY
      subscriber.lastEmailSent = currentRoundId
      subscriber.lastTelegramSent = currentRoundId
      subscriber.lastEmailSentForUnbondedStatus = currentRoundId
      subscriber.lastPendingToBondingPeriodEmailSent = currentRoundId
      subscriber.lastPendingToBondingPeriodTelegramSent = currentRoundId

      await subscriber.save()

      console.log(`After`, JSON.parse(JSON.stringify(subscriber)))

      console.log(
        `Subscriber ${subscriber.id} with email ${subscriber.email} migrated data successfully`
      )
    }
    exitJob = true
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

// Wait until job was finished
function wait() {
  if (!exitJob) {
    setTimeout(wait, 1000)
  } else {
    process.exit(0)
  }
}
wait()
