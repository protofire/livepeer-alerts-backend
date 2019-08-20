const express = require('express')
const { list } = require('./pool.controller')

const router = express.Router() // eslint-disable-line new-cap

router
  .route('/')
  /** GET /api/pools - Get list of pools */
  .get(list)

module.exports = router
