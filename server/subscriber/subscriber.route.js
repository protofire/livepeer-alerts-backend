const express = require('express')
const validate = require('express-validation')
const paramValidation = require('../../config/param-validation')
const {
  list,
  create,
  activate,
  summary,
  get,
  getByAddress,
  update,
  loadByAddress,
  loadBySubscriberId,
  remove,
  stats
} = require('./subscriber.controller')

const router = express.Router() // eslint-disable-line new-cap

router
  .route('/')
  /** GET /api/subscribers - Get list of subscribers */
  .get(list)

  /** POST /api/subscribers - Create new subscriber */
  .post(validate(paramValidation.createSubscriber), create)

router
  .route('/activate')

  /** POST /api/subscribers/activate - Activate new subscriber */
  .post(validate(paramValidation.activateSubscriber), activate)

router
  .route('/stats')

  /** GET /api/subscribers/stats  */
  .get(stats)

router
  .route('/summary/:addressWithoutSubscriber')

  /** GET /api/subscribers/summary/:address - Get summary by address */
  .get(validate(paramValidation.getSummary), summary)

router
  .route('/address/:address')

  /** GET /api/subscribers/address/:address - Get subscriber by address */
  .get(validate(paramValidation.getByAddress), getByAddress)

router
  .route('/:subscriberId')
  /** GET /api/subscribers/:subscriberId - Get subscriber */
  .get(validate(paramValidation.getSubscriber), get)

  /** PUT /api/subscribers/:subscriberId - Update subscriber */
  .put(validate(paramValidation.updateSubscriber), update)

  /** DELETE /api/subscribers/:subscriberId - Delete subscriber */
  .delete(validate(paramValidation.deleteSubscriber), remove)

/** Load subscriber when API with subscriberId route parameter is hit */
router.param('subscriberId', loadBySubscriberId)

/** Load subscriber when API with address route parameter is hit */
router.param('address', loadByAddress)

module.exports = router
