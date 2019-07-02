const Promise = require('bluebird')
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
  frequency: {
    type: String,
    required: true
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
  lastEmailSent: {
    type: Date,
    default: null
  },
  lastTelegramSent: {
    type: Date,
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
  },

  async getDelegatorSubscribers() {
    const { getSubscriptorRole } = require('../helpers/utils')
    const delegatorsList = []
    const rolesCheckPromise = []
    const allSubscribers = await this.find()
    if (allSubscribers) {
      for (let subscriberIterator of allSubscribers) {
        const newRolePromise = getSubscriptorRole(subscriberIterator).then(result => {
          const { constants, role, delegator } = result
          if (role === constants.ROLE.DELEGATOR) {
            delegatorsList.push({
              subscriber: subscriberIterator,
              delegator
            })
          }
        })
        rolesCheckPromise.push(newRolePromise)
      }
      await Promise.all(rolesCheckPromise)
    }
    return delegatorsList
  },

  async getListOfDelegateAddressAndDelegatorAddress() {
    const subscribersDelegators = await this.getDelegatorSubscribers()
    const list = []
    for (let subscriberIterator of subscribersDelegators) {
      const { delegator, subscriber } = subscriberIterator
      const item = {
        subscriber,
        delegatorAddress: delegator.address,
        delegateAddress: delegator.delegateAddress
      }
      list.push(item)
    }
    return list
  }
}

/**
 * @typedef Subscriber
 */
const subscriber = mongoose.model('Subscriber', SubscriberSchema)

// Dropping an old Index in MongoDB
subscriber.collection.dropIndex('email_1', function(err, result) {})

module.exports = subscriber
