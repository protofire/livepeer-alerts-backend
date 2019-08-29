const mongoose = require('mongoose')

/**
 * Pool Schema
 * Pool are the earnings of a round for a delegate
 */
const PoolSchema = new mongoose.Schema({
  // Id format: DelegateAddress-RoundId
  _id: {
    type: String,
    required: true
  },
  // The reward amount of the delegate for that round
  rewardTokens: {
    type: String,
    required: false,
    default: null
  },
  // The totalStake of the delegate on that round
  totalStakeOnRound: {
    type: String,
    required: false,
    default: null
  },
  delegate: {
    type: String,
    ref: 'Delegate',
    required: true
  },
  round: {
    type: String,
    ref: 'Round',
    required: true
  }
})

// Mongoose compound index (delegate, round)
PoolSchema.index({ delegate: 1, round: 1 }, { unique: true })

/**
 * Methods
 */
PoolSchema.method({})

PoolSchema.statics = {
  /**
   * List pools in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of pools to be skipped.
   * @param {number} limit - Limit number of pools to be returned.
   * @returns {Promise<Pools[]>}
   */
  list({ skip = 0, limit = 50, delegate } = {}) {
    let find
    if (delegate) {
      find = this.find({ delegate })
    } else {
      find = this.find()
    }

    return find
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec()
  }
}

/**
 * @typedef Pool
 */
const pool = mongoose.model('Pool', PoolSchema)

module.exports = pool
