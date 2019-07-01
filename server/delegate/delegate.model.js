const mongoose = require('mongoose')

/**
 * Delegate Schema
 */
const DelegateSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    required: false
  },
  ensName: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: false
  },
  lastRewardRound: {
    type: String,
    required: false
  },
  rewardCut: {
    type: String,
    required: false
  },
  feeShare: {
    type: String,
    required: false
  },
  pricePerSegment: {
    type: String,
    required: false
  },
  pendingRewardCut: {
    type: String,
    required: false
  },
  pendingFeeShare: {
    type: String,
    required: false
  },
  pendingPricePerSegment: {
    type: String,
    required: false
  },
  totalStake: {
    type: String,
    required: false
  },
  rewards: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'Reward',
      required: false
    }
  ]
})

DelegateSchema.virtual('address').get(function() {
  return this._id
})

/**
 * Methods
 */
DelegateSchema.method({})

/**
 * @typedef Delegate
 */
const delegate = mongoose.model('Delegate', DelegateSchema)

module.exports = delegate
