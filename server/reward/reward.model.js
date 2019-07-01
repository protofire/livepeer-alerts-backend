const mongoose = require('mongoose')

/**
 * Reward Schema
 */
const RewardSchema = new mongoose.Schema({
  // Id format: DelegateAddress-RoundId
  _id: {
    type: String,
    required: true
  },
  // The reward amount of the delegate for that round
  rewardTokens: {
    type: String,
    required: false
  },
  // The totalStake of the delegate on that round
  totalStakeOnRound: {
    type: String,
    required: true
  },
  delegate: {
    type: mongoose.Types.ObjectId,
    ref: 'Delegate',
    required: true
  },
  round: {
    type: mongoose.Types.ObjectId,
    ref: 'Round',
    required: true
  }
})

// Mongoose compound index (delegate, round)
RewardSchema.index({ delegate: 1, round: 1 }, { unique: true })

/**
 * Methods
 */
RewardSchema.method({})

/**
 * @typedef Reward
 */
const reward = mongoose.model('Reward', RewardSchema)

module.exports = reward
