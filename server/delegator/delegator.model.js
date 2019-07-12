const mongoose = require('mongoose')

/**
 * Delegator Schema
 */
const DelegatorSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  delegate: {
    type: String,
    ref: 'Delegate',
    required: true
  },
  startRound: {
    type: String,
    required: false
  },
  totalStake: {
    type: String,
    required: false,
    default: '0'
  },
  shares: [
    {
      type: String,
      ref: 'Share',
      required: false
    }
  ]
})

DelegatorSchema.virtual('address').get(function() {
  return this._id
})

/**
 * Methods
 */
DelegatorSchema.method({})

/**
 * @typedef Delegator
 */
const delegator = mongoose.model('Delegator', DelegatorSchema)

module.exports = delegator
