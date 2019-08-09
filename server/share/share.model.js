const mongoose = require('mongoose')

/**
 * Share Schema
 * Share are the earnings given to a delegator from a delegate
 */
const ShareSchema = new mongoose.Schema({
  // Id format: DelegatorAddress-RoundId
  _id: {
    type: String,
    required: true
  },
  // The reward amount of the delegator for that round
  rewardTokens: {
    type: String,
    required: false
  },
  // The totalStake of the delegator on that round
  totalStakeOnRound: {
    type: String,
    required: true
  },
  delegator: {
    type: String,
    required: true,
    ref: 'Delegator'
  },
  // The address of the delegate that provided the share on that round
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

// Mongoose compound index (delegator, round)
ShareSchema.index({ delegator: 1, round: 1 }, { unique: true })

/**
 * Methods
 */
ShareSchema.method({})

/**
 * Statics
 */

// TODO -- Test add two shares with same delegator and round -> should throw error
ShareSchema.statics = {
  async getDelegatorShareAmountOnRound(roundId, delegatorAddress) {
    if (!roundId || !delegatorAddress) {
      console.error('[ShareSchema] - the roundId or delegatorAddress provided are not defined')
      return null
    }
    const roundShare = await this.findOne({ delegator: delegatorAddress, round: roundId })
    // If there are no shares for that user, returns 0
    if (!roundShare) {
      return 0
    }
    return roundShare.rewardTokens
  }
}

/**
 * @typedef Share
 */
const share = mongoose.model('Share', ShareSchema)

module.exports = share
