const Subscriber = require('./subscriber.model')
const { sendActivationEmail } = require('../helpers/sendEmail')
const { getLivepeerDelegatorAccount } = require('../helpers/livepeerAPI')

/**
 * Load subscriber and append to req.
 */
function loadBySubscriberId(req, res, next, subscriberId) {
  Subscriber.get(subscriberId)
    .then(subscriber => {
      req.subscriber = subscriber // eslint-disable-line no-param-reassign
      return next()
    })
    .catch(e => next(e))
}

/**
 * Load subscriber by address and append to req.
 */
function loadByAddress(req, res, next, address) {
  Subscriber.getByAddress(address)
    .then(subscriber => {
      req.subscriber = subscriber // eslint-disable-line no-param-reassign
      return next()
    })
    .catch(e => next(e))
}

/**
 * Get subscriber
 * @returns {Subscriber}
 */
function get(req, res) {
  return res.json(req.subscriber)
}

/**
 * Create new subscriber
 * @property {string} req.body.username - The username of subscriber.
 * @returns {Subscriber}
 */
function create(req, res, next) {
  const subscriber = new Subscriber({
    email: req.body.email,
    address: req.body.address,
    frequency: req.body.frequency
  })

  subscriber
    .save()
    .then(savedSubscriber => {
      sendActivationEmail(savedSubscriber.email)
      return res.json(savedSubscriber)
    })
    .catch(e => next(e))
}

/**
 * Update existing subscriber
 * @property {string} req.body.username - The username of subscriber.
 * @returns {Subscriber}
 */
function update(req, res, next) {
  const subscriber = req.subscriber

  // Email is different, so we set the activated field to zero
  const differentEmail = req.body.email !== subscriber.email
  let options
  if (differentEmail) {
    subscriber.activated = 0
  } else {
    // Disable email validation
    options = { validateBeforeSave: false }
  }

  // Set subscriber properties
  subscriber.email = req.body.email
  subscriber.address = req.body.address
  subscriber.frequency = req.body.frequency

  subscriber
    .save(options)
    .then(savedSubscriber => {
      if (differentEmail) {
        sendActivationEmail(savedSubscriber.email)
      }

      res.json(savedSubscriber)
    })
    .catch(e => next(e))
}

/**
 * Get subscribers list.
 * @property {number} req.query.skip - Number of subscribers to be skipped.
 * @property {number} req.query.limit - Limit number of subscribers to be returned.
 * @returns {Subscriber[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query
  Subscriber.list({ limit, skip })
    .then(subscribers => res.json(subscribers))
    .catch(e => next(e))
}

/**
 * Delete subscriber.
 * @returns {Subscriber}
 */
function remove(req, res, next) {
  const subscriber = req.subscriber
  subscriber
    .remove()
    .then(deletedSubscriber => res.json(deletedSubscriber))
    .catch(e => next(e))
}

/**
 * Activate subscriber.
 * @returns {Subscriber}
 */
function activate(req, res, next) {
  const activatedCode = req.body.activatedCode
  Subscriber.getByActivatedCode(activatedCode)
    .then(subscriber => {
      subscriber.activated = 1
      subscriber.save({ validateBeforeSave: false }).then(savedSubscriber => {
        res.json(savedSubscriber)
      })
    })
    .catch(e => next(e))
}

/**
 * Summary information
 * @returns {Array}
 */
function summary(req, res, next) {
  const subscriber = req.subscriber
  getLivepeerDelegatorAccount(subscriber.address)
    .then(summary => res.json(summary))
    .catch(e => next(e))
}

module.exports = {
  loadBySubscriberId,
  loadByAddress,
  get,
  create,
  update,
  list,
  remove,
  activate,
  summary
}
