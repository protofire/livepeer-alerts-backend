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
    required: true
  },
  address: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

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
  }
}

/**
 * @typedef Subscriber
 */
module.exports = mongoose.model('Subscriber', SubscriberSchema)
