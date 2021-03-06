const { DAILY_FREQUENCY } = require('../../config/constants')

const mongoose = require('mongoose')
const httpStatus = require('http-status')
const APIError = require('../helpers/APIError')

/**
 * Subscriber Schema
 */
let SubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false,
    default: null
  },
  address: {
    type: String,
    required: true
  },
  emailFrequency: {
    type: String,
    required: true,
    default: DAILY_FREQUENCY
  },
  telegramFrequency: {
    type: String,
    required: false,
    default: DAILY_FREQUENCY
  },
  telegramChatId: {
    type: String,
    required: false,
    default: null
  },
  activated: {
    type: Number,
    min: 0,
    max: 1,
    default: 1 // Activated
  },
  activatedCode: {
    type: String,
    default: () => {
      return Math.floor(Math.random() * 900000000300000000000) + 1000000000000000
    }
  },
  // References the roundID in which the last email was sent for the unbonded status
  lastEmailSentForUnbondedStatus: {
    type: String,
    default: null
  },
  // References the roundID in which the last email was sent
  lastEmailSent: {
    type: String,
    default: null
  },
  // References the roundID in which the last telegram was sent
  lastTelegramSent: {
    type: String,
    default: null
  },
  // References the roundID in which the last pending to bonding period email was sent
  lastPendingToBondingPeriodEmailSent: {
    type: String,
    default: null
  },
  // References the roundID in which the last pending to bonding period email was sent
  lastPendingToBondingPeriodTelegramSent: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

/**
 * Methods
 */
SubscriberSchema.method({})

/**
 * Statics
 */
SubscriberSchema.statics = {
  /**
   * Get subscriber
   * @param {ObjectId} id - The objectId of subscriber.
   * @returns {Promise<Subscriber, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then(subscriber => {
        if (subscriber) {
          return subscriber
        }
        const err = new APIError('No such subscriber exists!', httpStatus.NOT_FOUND)
        return Promise.reject(err)
      })
  },

  /**
   * Get subscriber by address
   * @param {ObjectId} address - The address of subscriber.
   * @returns {Promise<Subscriber, APIError>}
   */
  getByAddress(address) {
    return this.findOne({ address: { $regex: address, $options: 'i' } })
      .exec()
      .then(subscriber => {
        if (subscriber) {
          return subscriber
        }
        const err = new APIError('No such subscriber exists!', httpStatus.NOT_FOUND)
        return Promise.reject(err)
      })
  },

  /**
   * Get subscriber by activatedCode
   * @param {ObjectId} activatedCode - The objectId of subscriber.
   * @returns {Promise<Subscriber, APIError>}
   */
  getByActivatedCode(activatedCode) {
    return this.findOne({ activatedCode: activatedCode })
      .exec()
      .then(subscriber => {
        if (subscriber) {
          return subscriber
        }
        const err = new APIError('No such subscriber exists!', httpStatus.NOT_FOUND)
        return Promise.reject(err)
      })
  },

  /**
   * List subscribers in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of subscribers to be skipped.
   * @param {number} limit - Limit number of subscribers to be returned.
   * @returns {Promise<Subscriber[]>}
   */
  list({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec()
  },

  removeAll() {
    return this.remove({})
      .exec()
      .then(results => {
        if (results) {
          return results
        }
        return Promise.reject(new Error('Cant remove subscribers'))
      })
  }
}

/**
 * @typedef Subscriber
 */
const subscriber = mongoose.model('Subscriber', SubscriberSchema)

// Dropping an old Index in MongoDB
subscriber.collection.dropIndex('email_1', function(err, result) {})

module.exports = subscriber
