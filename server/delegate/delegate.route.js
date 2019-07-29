const express = require('express')
const validate = require('express-validation')
const paramValidation = require('../../config/param-validation')

const router = express.Router() // eslint-disable-line new-cap
const { getByAddress, topDelegates, getDelegateRewardStatus } = require('./delegate.controller')

/** GET /api/delegates/address/:address - Get delegate by address */
router
  .route('/address/:address')

  .get(validate(paramValidation.getByAddress), getByAddress)

/** GET /api/delegates/top/:number - Get the top of delegates by ROI */
router
  .route('/top/:number')

  .get(validate(paramValidation.getTopDelegates), topDelegates)

/** GET /api/delegates/rewardStatus/:address - Get delegate reward status*/
router
  .route('/rewardStatus/:address')
  .get(validate(paramValidation.getByAddress), getDelegateRewardStatus)

module.exports = router
