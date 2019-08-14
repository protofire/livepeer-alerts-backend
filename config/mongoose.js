const mongoose = require('mongoose')
const config = require('./config')

// connect to mongo db
const mongoUri = config.mongo.host
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  keepAlive: true,
  useCreateIndex: true,
  writeConcern: {
    w: 0
  },
  // MongoDB findAndModify is deprecated, this should be used to disable it
  useFindAndModify: false
})
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`)
})

// print mongoose logs in dev env
if (config.mongooseDebug) {
  mongoose.set('debug', (collectionName, method, query, doc) => {})
}

module.exports = mongoose
