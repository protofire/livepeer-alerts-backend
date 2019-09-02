const Share = require('./share.model')

/**
 * Get shares list.
 * @property {number} req.query.skip - Number of shares to be skipped.
 * @property {number} req.query.limit - Limit number of shares to be returned.
 * @returns {Round[]}
 */
const list = (req, res, next) => {
  const { limit = 50, skip = 0, delegator, delegate } = req.query
  Share.list({ limit, skip, delegator, delegate })
    .then(shares => res.json(shares))
    .catch(e => next(e))
}

module.exports = {
  list
}
