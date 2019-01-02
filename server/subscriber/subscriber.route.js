const express = require('express')
const validate = require('express-validation')
const paramValidation = require('../../config/param-validation')
const subscriberController = require('./subscriber.controller')

const router = express.Router() // eslint-disable-line new-cap

router
  .route('/')
  /** GET /api/subscribers - Get list of subscribers */
  .get(subscriberController.list)

  /** POST /api/subscribers - Create new subscriber */
  .post(validate(paramValidation.createSubscriber), subscriberController.create)

router
  .route('/activate')

  /** POST /api/subscribers/activate - Activate new subscriber */
  .post(validate(paramValidation.activateSubscriber), subscriberController.activate)

router
  .route('/summary/:addressWithoutSubscriber')

  /** GET /api/subscribers/summary/:address - Get summary by address */
  .get(validate(paramValidation.getSummary), subscriberController.summary)

router
  .route('/address/:address')

  /** GET /api/subscribers/address/:address - Get subscriber by address */
  .get(validate(paramValidation.getByAddress), subscriberController.getByAddress)

router
  .route('/:subscriberId')
  /** GET /api/subscribers/:subscriberId - Get subscriber */
  .get(validate(paramValidation.getSubscriber), subscriberController.get)

  /** PUT /api/subscribers/:subscriberId - Update subscriber */
  .put(validate(paramValidation.updateSubscriber), subscriberController.update)

  /** DELETE /api/subscribers/:subscriberId - Delete subscriber */
  .delete(subscriberController.remove)

/** Load subscriber when API with subscriberId route parameter is hit */
router.param('subscriberId', subscriberController.loadBySubscriberId)

/** Load subscriber when API with address route parameter is hit */
router.param('address', subscriberController.loadByAddress)

module.exports = router
