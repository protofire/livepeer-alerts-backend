const express = require('express')
const validate = require('express-validation')
const paramValidation = require('../../config/param-validation')

const router = express.Router() // eslint-disable-line new-cap
const { getNextReward, getDelegator, getSummary30RoundsRewards } = require('./delegator.controller')

/** GET /api/delegators/reward/:address - Get delegator next reward by address */
router
  .route('/reward/:address')

  .get(validate(paramValidation.getByAddress), getNextReward)

router
  .route('/address/:address')

  .get(validate(paramValidation.getByAddress), getDelegator)

/** GET /api/delegators/lastRewards/:address - Get delegator last 30 rewards by address */
router
  .route('/lastRewards/:address')

  .get(validate(paramValidation.getByAddress), getSummary30RoundsRewards)

module.exports = router
