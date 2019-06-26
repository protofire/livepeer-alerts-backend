const express = require('express')
const validate = require('express-validation')
const paramValidation = require('../../config/param-validation')

const router = express.Router() // eslint-disable-line new-cap
const { getByAddress, getROI } = require('./delegate.controller')

/** GET /api/delegates/address/:address - Get delegate by address */
router
  .route('/address/:address')

  .get(validate(paramValidation.getByAddress), getByAddress)

/** GET /api/delegates/roi/:address - Get delegate ROI by address */
router
  .route('/roi/:address')

  .get(validate(paramValidation.getByAddress), getROI)

module.exports = router
