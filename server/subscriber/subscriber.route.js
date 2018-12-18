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
  .route('/:subscriberId')
  /** GET /api/subscribers/:subscriberId - Get subscriber */
  .get(validate(paramValidation.getSubscriber), subscriberController.get)

  /** PUT /api/subscribers/:subscriberId - Update subscriber */
  .put(validate(paramValidation.updateSubscriber), subscriberController.update)

  /** DELETE /api/subscribers/:subscriberId - Delete subscriber */
  .delete(subscriberController.remove)

/** Load subscriber when API with subscriberId route parameter is hit */
router.param('subscriberId', subscriberController.load)

module.exports = router
