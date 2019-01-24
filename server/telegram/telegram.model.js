const Promise = require('bluebird')
const mongoose = require('mongoose')

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
  }
}

/**
 * @typedef Telegram
 */
const telegram = mongoose.model('Telegram', TelegramSchema)

module.exports = telegram
