const express = require('express')
const { list, remove, loadByAddress } = require('./telegram.controller')

const router = express.Router() // eslint-disable-line new-cap

router
  .route('/')
  /** GET /api/telegrams - Get list of telegrams */
  .get(list)

router
  .route('/:address')

  /** DELETE /api/telegrams/:address - Delete telegrams by address */
  .delete(remove)

/** Load subscriber when API with address route parameter is hit */
router.param('address', loadByAddress)

module.exports = router
