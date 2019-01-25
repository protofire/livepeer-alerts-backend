const { MongoClient } = require('mongodb')
const mongoDbQueue = require('mongodb-queue')

const mongoose = require('../../config/mongoose')
const config = require('../../config/config')
const { getLivepeerCurrentRoundInfo } = require('../helpers/livepeerAPI')
const Round = require('../round/round.model')

const { mongo = {} } = config
const { host, database } = mongo
let queue

console.log(`[ProcessChangeRound] - Start`)

MongoClient.connect(
  host,
  { useNewUrlParser: true },
  (err, client) => {
    const db = client.db(database)
    queue = mongoDbQueue(db, 'round-queue')

    queue.done(function(err, count) {
      console.log('[ProcessChangeRound] - This queue has processed %d messages', count)
    })

    // Polling messages
    const poll = cb => {
      queue.get((err, msg) => {
        if (err || !msg) {
          return setTimeout(() => poll(cb), 500)
        }

        cb(err, msg, () => {
          queue.ack(msg.ack, () => {
            console.log(`[ProcessChangeRound] - Message finished with id ${msg.id}`)
          })
          poll(cb) // get next message
        })
      })
    }

    poll(function(err, msg, next) {
      // process message
      console.log(`[ProcessChangeRound] - Message received ${JSON.stringify(msg)}`)

      // get next message
      next()
    })
  }
)
