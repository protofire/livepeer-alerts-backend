const mongoose = require('../../config/mongoose')
const config = require('../../config/config')

const { sendRoundNotifications } = require('../helpers/notification/notificationUtils')
const { getProtocolService } = require('../helpers/services/protocolService')
const roundPoolsUtils = require('../helpers/updateRoundPools')
const roundSharesUtils = require('../helpers/updateRoundShares')

const Round = require('../round/round.model')

const workerCheckRoundChange = new Promise(async (resolve, reject) => {
  console.log(`[Check-Round-Change] - Start`)

  const { thresholdSendNotification } = config
  const protocolService = getProtocolService()
  const currentRoundInfo = await protocolService.getLivepeerRoundProgress()
  let { id, initialized, lastInitializedRound, length, startBlock, progress } = currentRoundInfo

  if (!initialized) {
    resolve(`The round is not initialized. skipping checkRoundChange`)
  }

  let actualSavedRound = await Round.findOne({ roundId: id })
  if (actualSavedRound) {
    try {
      console.log(`The round did not changed, sending notifications if needed`)
      await sendRoundNotifications(progress, actualSavedRound, thresholdSendNotification)
      resolve(`Notifications sent, finish check round change`)
    } catch (err) {
      const message = err && err.message
      reject(`Error sending notifications: ${message}`)
    }
  } else {
    // There is a new round, creates it on the db, updates pools, shares and send notifications
    try {
      console.log(
        `The round did changed, the new actual round is ${id}, sending round notifications`
      )

      const data = {
        _id: id,
        roundId: id,
        initialized,
        lastInitializedRound,
        length,
        startBlock
      }
      let roundCreated = await Round.create(data)
      await sendRoundNotifications(progress, roundCreated, thresholdSendNotification)
      resolve(`Notifications sent, finish check round change`)
    } catch (err) {
      const message = err && err.message
      reject(`Error sending notifications: ${message}`)
    }
  }
})

workerCheckRoundChange
  .then(message => {
    console.log(message)
    mongoose.connection.close()
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
