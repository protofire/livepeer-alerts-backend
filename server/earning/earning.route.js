const express = require('express')
const earningController = require('./earning.controller')

const router = express.Router() // eslint-disable-line new-cap

router
  .route('/')
  /** GET /api/earning - Get list of earnings */
  .get(earningController.list)

module.exports = router
