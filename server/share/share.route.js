const express = require('express')
const { list } = require('./share.controller')

const router = express.Router() // eslint-disable-line new-cap

router
  .route('/')
  /** GET /api/shares - Get list of shares */
  .get(list)

module.exports = router
