const mongoose = require('mongoose')

/**
 * Round Schema
 */
const RoundSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  roundId: {
    type: String,
    required: true
  },
  initialized: {
    type: Boolean,
    required: true
  },
  lastInitializedRound: {
    type: String,
    required: true
  },
  length: {
    type: String,
    required: true
  },
  startBlock: {
    type: String,
    required: true
  },
  notificationsForRoundSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  pools: [
    {
      type: String,
      ref: 'Pool',
      required: false,
      default: []
    }
  ],
  shares: [
    {
      type: String,
      ref: 'Share',
      required: false,
      default: []
    }
  ]
})

/**
 * Methods
 */
RoundSchema.method({})

/**
 * Statics
 */
RoundSchema.statics = {
  /**
   * List Rounds in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of rounds to be skipped.
   * @param {number} limit - Limit number of rounds to be returned.
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
 * @typedef Round
 */
const round = mongoose.model('Round', RoundSchema)

module.exports = round
