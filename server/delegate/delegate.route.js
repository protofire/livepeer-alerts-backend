const express = require('express')
const validate = require('express-validation')
const paramValidation = require('../../config/param-validation')

const router = express.Router() // eslint-disable-line new-cap
const { delegateByAddress } = require('./delegate.controller')

/** GET /api/delegates/:address - Get delegate by address */
router
  .route('/:address')

  .get(validate(paramValidation.getDelegate), delegateByAddress)

module.exports = router
