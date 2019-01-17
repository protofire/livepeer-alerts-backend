const Promise = require('bluebird')
const mongoose = require('mongoose')
const {
  getLivepeerDelegatorAccount,
  getLivepeerCurrentRoundInfo
} = require('../helpers/livepeerAPI')
const { MathBN } = require('../helpers/utils')
/**
 * Earning Schema
 */
let EarningSchema = new mongoose.Schema({
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
  },

  /**
   * Save an Earning related to a subscriber
   * @param subscriber
   * @returns {Promise<void>}
   */
  async save(subscriber) {
    const { address, email } = subscriber
    let [delegator, currentRoundInfo] = await Promise.all([
      getLivepeerDelegatorAccount(address),
      getLivepeerCurrentRoundInfo()
    ])

    const { lastClaimRound, pendingStake, bondedAmount } = delegator
    const unclaimedRounds = MathBN.sub(currentRoundInfo.lastInitializedRound, lastClaimRound)

    const hasUnclaimedRounds = unclaimedRounds !== '0'
    const earnedStake = hasUnclaimedRounds
      ? MathBN.max('0', MathBN.sub(pendingStake, bondedAmount))
      : '0'

    const earningData = {
      email: email,
      address: address,
      earning: earnedStake,
      round: currentRoundInfo.id
    }

    return await this.create(earningData)
  }
}

/**
 * @typedef Earning
 */
const earning = mongoose.model('Earning', EarningSchema)

module.exports = earning
