const express = require('express')
const { list } = require('./round.controller')

const router = express.Router() // eslint-disable-line new-cap

router
  .route('/')
  /** GET /api/rounds - Get list of rounds */
  .get(list)

module.exports = router
