const express = require('express')
const { list, protocolInfo } = require('./round.controller')

const router = express.Router() // eslint-disable-line new-cap

router
  .route('/')
  /** GET /api/rounds - Get list of rounds */
  .get(list)
router
  .route('/protocol')
  /** GET /api/rounds - Get list of rounds */
  .get(protocolInfo)

module.exports = router
