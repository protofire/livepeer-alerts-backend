const Promise = require('bluebird')
const mongoose = require('mongoose')

/**
 * Earning Schema
 */
const EarningSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false,
    default: null
  },
  address: {
    type: String,
    required: true
  },
  earning: {
    type: Number,
    required: true,
    default: 0
  },
  round: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

/**
 * Methods
 */
EarningSchema.method({})

/**
 * Statics
 */
EarningSchema.statics = {
  /**
   * List earnings in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of earnings to be skipped.
   * @param {number} limit - Limit number of earnings to be returned.
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
 * @typedef Earning
 */
module.exports = mongoose.model('Earning', EarningSchema)
