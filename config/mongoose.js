const mongoose = require('mongoose')
const config = require('./config')

Promise = require('bluebird') // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise

// connect to mongo db
const mongoUri = config.mongo.host
mongoose.connect(mongoUri, { useNewUrlParser: true, keepAlive: true, useCreateIndex: true })
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`)
})

// print mongoose logs in dev env
if (config.mongooseDebug) {
  mongoose.set('debug', (collectionName, method, query, doc) => {})
}

module.exports = mongoose
