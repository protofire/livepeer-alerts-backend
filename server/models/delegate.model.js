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
    required: true
  },
  ensName: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: true
  },
  lastRewardRound: {
    type: String,
    required: true
  },
  rewardCut: {
    type: String,
    required: true
  },
  feeShare: {
    type: String,
    required: true
  },
  pricePerSegment: {
    type: String,
    required: true
  },
  pendingRewardCut: {
    type: String,
    required: true
  },
  pendingFeeShare: {
    type: String,
    required: true
  },
  pendingPricePerSegment: {
    type: String,
    required: true
  },
  totalStake: {
    type: String,
    required: true
  },
  startBlock: {
    type: String,
    required: true
  }
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
