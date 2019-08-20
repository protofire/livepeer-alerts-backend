const Share = require('./share.model')

/**
 * Get shares list.
 * @property {number} req.query.skip - Number of rounds to be skipped.
 * @property {number} req.query.limit - Limit number of rounds to be returned.
 * @returns {Round[]}
 */
const list = (req, res, next) => {
  const { limit = 50, skip = 0 } = req.query
  Share.list({ limit, skip })
    .then(shares => res.json(shares))
    .catch(e => next(e))
}

module.exports = {
  list
}
