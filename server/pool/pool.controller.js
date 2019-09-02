const Pool = require('./pool.model')

/**
 * Get pools list.
 * @property {number} req.query.skip - Number of pools to be skipped.
 * @property {number} req.query.limit - Limit number of pools to be returned.
 * @returns {Round[]}
 */
const list = (req, res, next) => {
  const { limit = 50, skip = 0, delegate } = req.query
  Pool.list({ limit, skip, delegate })
    .then(shares => res.json(shares))
    .catch(e => next(e))
}

module.exports = {
  list
}
