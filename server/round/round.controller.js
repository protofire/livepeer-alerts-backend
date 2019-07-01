const Round = require('./round.model')

/**
 * Get round list.
 * @property {number} req.query.skip - Number of rounds to be skipped.
 * @property {number} req.query.limit - Limit number of rounds to be returned.
 * @returns {Round[]}
 */
const list = (req, res, next) => {
  const { limit = 50, skip = 0 } = req.query
  Round.list({ limit, skip })
    .then(telegrams => res.json(telegrams))
    .catch(e => next(e))
}

module.exports = {
  list
}
