const express = require('express')
const validate = require('express-validation')
const paramValidation = require('../../config/param-validation')

const router = express.Router() // eslint-disable-line new-cap
const { getNextReward } = require('./delegator.controller')

/** GET /api/delegators/reward/:address - Get delegate next reward by address */
router
  .route('/reward/:address')

  .get(validate(paramValidation.getByAddress), getNextReward)

module.exports = router
