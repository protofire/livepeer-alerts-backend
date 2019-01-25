const { MongoClient } = require('mongodb')
const mongoDbQueue = require('mongodb-queue')

const mongoose = require('../../config/mongoose')
const config = require('../../config/config')
const { getLivepeerCurrentRoundInfo } = require('../helpers/livepeerAPI')
const Round = require('../round/round.model')

const { mongo = {} } = config
const { host, database } = mongo
let queue

MongoClient.connect(
  host,
  { useNewUrlParser: true },
  (err, client) => {
    const db = client.db(database)
    queue = mongoDbQueue(db, 'round-queue')
  }
)

const checkChangeRound = async () => {
  console.log(`[CheckChangeRound] - Start`)

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

  id = '1251'
  if (!actualSavedRound) {
    let roundCreated = new Round(data)
    actualSavedRound = await roundCreated.save()
  }

  if (!actualSavedRound) {
    throw new Error(`There is no actual round`)
  }

  console.log(`[CheckChangeRound] - Actual round ${id}`)

  if (actualSavedRound.roundId !== id) {
    // Update fields
    actualSavedRound.roundId = id
    actualSavedRound.initialized = initialized
    actualSavedRound.lastInitializedRound = lastInitializedRound
    actualSavedRound.length = length
    actualSavedRound.startBlock = startBlock
    await actualSavedRound.save()

    // Create job, round changed
    queue.add({ roundId: actualSavedRound.roundId }, { delay: 1 * 60 }, (err, id) => {
      console.log(`[CheckChangeRound] - Create job, round changed to #${actualSavedRound.roundId}`)
      process.exit(0)
    })
  } else {
    console.log(`[CheckChangeRound] - No job created`)
    process.exit(0)
  }
}

return checkChangeRound()
