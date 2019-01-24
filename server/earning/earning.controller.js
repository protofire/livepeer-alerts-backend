const Earning = require('./earning.model')

/**
 * Get earnings list.
 * @property {number} req.query.skip - Number of earnings to be skipped.
 * @property {number} req.query.limit - Limit number of earnings to be returned.
 * @returns {Earning[]}
 */
const list = (req, res, next) => {
  const { limit = 50, skip = 0 } = req.query
  Earning.list({ limit, skip })
    .then(earnings => res.json(earnings))
    .catch(e => next(e))
}

module.exports = {
  list
}
