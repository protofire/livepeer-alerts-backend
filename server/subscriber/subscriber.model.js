const Promise = require('bluebird')
const mongoose = require('mongoose')
const httpStatus = require('http-status')
const APIError = require('../helpers/APIError')

/**
 * Subscriber Schema
 */
const SubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: { unique: true }
  },
  address: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
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
  lastEmailSent: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

/**
 * Unique validator for email
 */
SubscriberSchema.path('email').validate(function(value, done) {
  return mongoose
    .model('Subscriber')
    .countDocuments({ email: value })
    .exec()
    .then(function(count) {
      return !count
    })
    .catch(function(err) {
      throw err
    })
}, 'Email already exists')

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
    return this.findOne({ address: address })
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

  /**
   * Get subscribers to notify
   * @param {number} skip - Number of subscribers to be skipped.
   * @param {number} limit - Limit number of subscribers to be returned.
   * @returns {Promise<Subscriber[]>}
   */
  getSubscribers(frequency) {
    return this.find({ frequency: frequency, activated: 1 })
      .exec()
      .then(subscribers => {
        return subscribers
      })
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
module.exports = mongoose.model('Subscriber', SubscriberSchema)
