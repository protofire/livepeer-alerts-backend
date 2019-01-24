const express = require('express')
const { list } = require('./telegram.controller')

const router = express.Router() // eslint-disable-line new-cap

router
  .route('/')
  /** GET /api/telegrams - Get list of telegrams */
  .get(list)

module.exports = router
