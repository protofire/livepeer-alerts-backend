const express = require('express')
const validate = require('express-validation')
const paramValidation = require('../../config/param-validation')

const router = express.Router() // eslint-disable-line new-cap
const { getNextReward, getDelegator } = require('./delegator.controller')

/** GET /api/delegators/reward/:address - Get delegate next reward by address */
router
  .route('/reward/:address')

  .get(validate(paramValidation.getByAddress), getNextReward)

router
  .route('/address/:address')

  .get(validate(paramValidation.getByAddress), getDelegator)

module.exports = router
