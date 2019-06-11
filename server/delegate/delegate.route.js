const express = require('express')
const validate = require('express-validation')
const paramValidation = require('../../config/param-validation')

const router = express.Router() // eslint-disable-line new-cap
const { delegateByAddress, delegateRoi, topDelegates } = require('./delegate.controller')

/** GET /api/delegates/:address - Get delegate by address */
router
  .route('/:address')

  .get(validate(paramValidation.getDelegate), delegateByAddress)

/** GET /api/delegates/roi/:address - Get delegate ROI by address */
router
  .route('/roi/:address')

  .get(validate(paramValidation.getDelegateRoi), delegateRoi)

/** GET /api/delegates/top/:number - Get the top of delegates by ROI */
router
  .route('/top/:number')

  .get(validate(paramValidation.getTopDelegates), topDelegates)

module.exports = router
