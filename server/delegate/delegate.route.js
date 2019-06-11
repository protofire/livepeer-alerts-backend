const express = require('express')
const validate = require('express-validation')
const paramValidation = require('../../config/param-validation')

const router = express.Router() // eslint-disable-line new-cap
const { delegateByAddress, delegateRoi } = require('./delegate.controller')

/** GET /api/delegate/:address - Get delegate by address */
router
  .route('/:address')

  .get(validate(paramValidation.getDelegate), delegateByAddress)

/** GET /api/delegate/roi/:address - Get delegate ROI by address */
router
  .route('/roi/:address')

  .get(validate(paramValidation.getDelegateRoi), delegateRoi)

module.exports = router
