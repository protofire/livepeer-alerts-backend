const Promise = require('bluebird')
const mongoose = require('mongoose')
const httpStatus = require('http-status')
const APIError = require('../helpers/APIError')

/**
 * Telegram Schema
 */
const TelegramSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  chatId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

/**
 * Methods
 */
TelegramSchema.method({})

/**
 * Statics
 */
TelegramSchema.statics = {
  /**
   * List telegrams in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of telegrams to be skipped.
   * @param {number} limit - Limit number of telegrams to be returned.
   * @returns {Promise<Earning[]>}
   */
  list({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec()
  },

  /**
   * Get telegrams by address
   * @param {ObjectId} address - The telegram address.
   * @returns {Promise<Array, APIError>}
   */
  getTelegramsByAddress(address) {
    return this.find({ address: address })
      .exec()
      .then(telegrams => {
        if (telegrams) {
          return telegrams
        }
        const err = new APIError('No such telegrams by address exists!', httpStatus.NOT_FOUND)
        return Promise.reject(err)
      })
  }
}

/**
 * @typedef Telegram
 */
const telegram = mongoose.model('Telegram', TelegramSchema)

module.exports = telegram
