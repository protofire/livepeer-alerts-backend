const Subscriber = require('./subscriber.model')

/**
 * Load subscriber and append to req.
 */
function load(req, res, next, id) {
  Subscriber.get(id)
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
    .then(savedSubscriber => res.json(savedSubscriber))
    .catch(e => next(e))
}

/**
 * Update existing subscriber
 * @property {string} req.body.username - The username of subscriber.
 * @returns {Subscriber}
 */
function update(req, res, next) {
  const subscriber = req.subscriber
  subscriber.email = req.body.email
  subscriber.address = req.body.address
  subscriber.frequency = req.body.frequency

  subscriber
    .save()
    .then(savedSubscriber => res.json(savedSubscriber))
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

module.exports = { load, get, create, update, list, remove }
